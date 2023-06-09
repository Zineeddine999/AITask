import {Bot} from './bot.js';
import fs from 'fs';
import path from 'path';

// Local bot uses in-memory data store. Will use file-based data store in future.
// It can keep 2FA keys for TOTPs, but does not have access to a server (for inbound email/SMS or webhooks).
// For SMS OTPs, it uses https://messages.google.com/web/ 
// So your android phone needs to be paired with the browser manually by scanning QR code.

export class LocalBot extends Bot {
	bot_id = null; // so that each bot can have its own userDataDir persisted across sessions
	browser = null; // puppeteer browser instance that bot can drive
	storage = null; // in-memory data store. TODO: use {data_dir}/{bot_id}.json to read/write
	data_dir = null;
	headless = false;

	constructor(bot_id, data_dir) { 
		super(); 
		this.bot_id = bot_id;
		this.data_dir = data_dir;
	}

	static async init({bot_id, data_dir, headless}) {
		// TODO: Allow caller to override puppeteer launch params for primary profile, extensions etc

		if(!bot_id) throw `bot_id not specified`;

		let bot = new LocalBot(bot_id, data_dir);
		bot.headless = headless;

		bot.storage = await loadJSONFile(data_dir, `${bot_id}.json`);
		// console.log("storage", bot.storage);

		return bot;
	}

	async get(key){ 
		// async so that it matches CloudBot behavior
		// console.log(`getting ${key}`);
		return new Promise((resolve, reject) => resolve(this.storage[key]));
	}

	async set(key, value){
		this.storage[key] = value;
		await saveObjectToFile(this.storage, this.data_dir, `${this.bot_id}.json`);
	}

	async get_latest_inbound_email(){
		throw 'Inbound Email is not supported in LocalBot. Use CloudBot';
	}

	async get_latest_inbound_sms(to_phone, pattern){
		// LocalBot only supports phone numbers with active Internet connection 
		// which use Google Messages app & are linked with messages.google.com/web
		// CloudBot can do this but also gives you a cloud-based phone #.

		// Google Messages on Web does not indicate the phone number an SMS was sent to.
		return await google_sms.get_latest_inbound_sms(this, {to_phone, pattern})
	}

	async send_sms(from_phone, to_phone, message){
		let send_from_sim_id = 1;
		return await google_sms.send_sms(this, {send_from_sim_id, to_phone, message})
	}

	async send_email(to, subject, body){
		// TODO: support Gmail or something else
		throw 'Outbound Email is not supported in LocalBot. Please use CloudBot'
	}
}

function readOrCreateFileWithDefaultContent(filepath, defaultContent) {
	try {
	  // Try to read the file
	  const content = fs.readFileSync(filepath, 'utf-8');
	  return content;
	} catch (err) {
	  if (err.code === 'ENOENT') {
		// File does not exist, create the directory if it does not exist
		const dir = path.dirname(filepath);
		if (!fs.existsSync(dir)) {
		  fs.mkdirSync(dir, { recursive: true });
		}
  
		// Create the file with default content
		fs.writeFileSync(filepath, defaultContent, 'utf-8');
		return defaultContent;
	  } else {
		// File exists but there was an error reading it
		throw err;
	  }
	}
}

function loadJSONFile(directoryPath, filename) {
	let fullPath = path.join(directoryPath, filename);
	let content = readOrCreateFileWithDefaultContent(fullPath, '{}');
	const jsonObj = JSON.parse(content);
	return jsonObj;
}

async function saveObjectToFile(obj, directoryPath, filename) {
	const jsonString = JSON.stringify(obj, null, 2);
	let fullPath = path.join(directoryPath, filename);
	readOrCreateFileWithDefaultContent(fullPath, '{}');
	fs.writeFileSync(fullPath, jsonString, 'utf8');
}