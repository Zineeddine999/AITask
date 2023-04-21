
export async function login(bot, params){
	const atlan_username = await bot.get_param('atlan', 'username', params);
    const atlan_password = '+f_3c6C&$ArWUwN'; 

	if(!atlan_username || !atlan_password) throw 'no credentials for atlan';

    const page = (await bot.browser.pages())[0];
	await page.goto('https://beta.atlan.dev/auth/realms/default/protocol/openid-connect/auth?client_id=atlan-frontend&redirect_uri=https%3A%2F%2Fbeta.atlan.dev%2F&state=6caccbcf-c641-4b13-99c4-d9bfebba9fa9&response_mode=fragment&response_type=code&scope=openid&nonce=decbd923-8a77-4b00-8936-6e254379f1f3&code_challenge=-Ci1VVqz3y9FgvnZS8MqeIvv70zGFh2m0ciccpsQcFk&code_challenge_method=S256');
	await bot.wait(5);

    await page.waitForSelector('#kc-form-login', { visible: true });

    // Fill in the username and password
    await page.type('#username', atlan_username, { delay: 50 });
    await page.type('#password', atlan_password, { delay: 50 });
  
    // Submit the form
    await page.click('#kc-login');

	await page.waitForNavigation();

	// Fill 2FA OTP if asked
	if(await page.$('input[name="otp"]')){
		const otp = await bot.get_2fa_totp('atlan', {}, params);
		if(!otp) throw `2FA not set up`;

		await page.type('input[name="otp"]', otp, { delay: 100 });
	
		const verify = await page.waitForSelector('text/Verify');
		await verify.click();
		await page.waitForNavigation();
	}

	if(page.url().includes('https://beta.atlan.dev/')){
		console.log("logged-in to atlan");
	} else {
		throw `still at ${page.url()}`;
	}
}

export async function open_insights(bot, params){
    console.log("opening insights");
    const page = (await bot.browser.pages())[0];
    await bot.wait(6);
    const link = await page.$('a[href="/insights"]');
    if (link) {
      await link.click();
    } else {
      console.log('Link not found!');
    }
  
    // Wait for page to load
    await page.waitForNavigation();
    console.log('Page title:', await page.title());
    await bot.wait(4);
}

export async function schedule_query(bot, params){

	await login(bot, {atlan_username: "zine.zidane@atlan.com"});
	await open_insights(bot);
	const query = await bot.get_param('atlan', 'query', params);
	const query_name = await bot.get_param('atlan', 'query_name', params);
	const email = await bot.get_param('atlan', 'email', params);

	if(!query || !email) throw 'missing inputs for schedule query task';
	const page = (await bot.browser.pages())[0];

	const prompt = `provide a description for the sql query: ${query}`;

	const response = await fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			prompt: prompt,
			max_tokens: 1000,
			n: 1,
			stop: '\n\n\n',
		}),
	});
	const data = await response.json();
	const query_description = data? data.choices[0].text.trim(): query_name;


	// if(page.url() == 'https://beta.atlan.dev/insights'){
	// 	console.log("currently on insights");
	// } else {
	// 	await open_insights(bot, {});
	// 	await bot.wait(4);
	// }
	// const connectionDropdown = await page.$('.dropdown-schema-explorer');
    // await bot.wait(2);
    // if (connectionDropdown) {
    //   await connectionDropdown.click();
    // } else {
    //   console.log('connection dropdown not found!');
	//   return;
    // }
	// const subConnectionItems = await page.$$('.submenu-title-content');

	// if(subConnectionItems && subConnectionItems.length > 0){
	// // Click on the first div element
	// await subConnectionItems[0].click();
    // await bot.wait(4);
	// }
	  // Find the div using its class name
	  const newQuery = await page.$('.flex.w-8.pt-3.pl-2.border-b.cursor-pointer.h-9.border-new-gray-300');

	  // Click the div
	  await newQuery.click();

	  await bot.wait(2);


	  const sqlQuery = await page.$('[data-test-id="sqlQuery"]');

	  // Click the div
	  await sqlQuery.click();

	console.log("in schedule query");

	const div = await page.$('div.view-lines.monaco-mouse-cursor-text');
	await bot.wait(2);
	console.log("66666666");
	if (div) {
	  const innerSpanSelector = 'div.view-line > span > span:nth-child(1)';
	  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s'"]+)/g;

	  // execute the regular expression on the SQL query string
	  const matches = query.match(regex);
	
	  // return the resulting array of elements
	  const spanList = matches || [];
	  console.log(spanList);
	  console.log("555555");
	//   const spanList = ['SELECT', '"SM_TYPE"', 'FROM', '"SHIP_MODE"' ,'LIMIT', '50;'];
	
	  // Loop through the span list and add each element to the inner span inside the div
	  for (const spanText of spanList) {
		await page.evaluate((innerSpanSelector, spanText) => {
		  const innerSpan = document.querySelector(innerSpanSelector);
		  const span = document.createElement('span');
		  span.textContent = spanText;
		  span.className="mtk5";
		  innerSpan.appendChild(span);
		  const space_span = document.createElement('span');
		  space_span.textContent = ' ';
		  space_span.className="mtk1";
		  innerSpan.appendChild(space_span);
		}, innerSpanSelector, spanText);
		await bot.wait(1);
	  }
	} else {
	  console.log('Div element not found');
	}
	console.log("1111");
	await bot.wait(2);

	// const element = await page.$('shortcut[shortcut-key="cmd+enter"]');

  
	// // check the edit-permission attribute to determine if the element is clickable
	// const isClickable = await element.evaluate(elem => elem.getAttribute('edit-permission') === 'true');
  
	// if (!isClickable) {
	//   console.error(`Element with shortcut key "${shortcutKey}" is not clickable`);
	//   return;
	// }
  
	// // click the element
	// await element.click();

	// await bot.wait(5);


	const mainSaveButton = await page.waitForSelector('atlanbtn[data-test-id="save"]');
	console.log("22222");
	await mainSaveButton.click();

	// click on the element
	await bot.wait(1);

	console.log(query_description);


	await page.type('input[data-test-id="title"]', query_name, { delay: 50 });
	await bot.wait(1);

	await page.type('textarea[data-test-id="description"]', query_description, { delay: 50 });
	await bot.wait(1);


	const saveButton = await page.$('button[data-test-id="Save"]');
	await bot.wait(1);

	const isButtonEnabled = await saveButton.evaluate((button) => !button.disabled);
  
	if (isButtonEnabled) {
	  await saveButton.click();
	}

	// console.log("collectionTab");

	// const collectionIcon = await page.$('[data-test-id="CollectionIconLarge"]');

	// if (collectionIcon) {
	//   // click the element
	//   await collectionIcon.click();
	//   console.log('Clicked the collection icon!');
	// } else {
	//   console.log('Collection icon not found or not visible.');
	// }
	// await page.waitForNavigation();

	await bot.wait(4);

	const spanElements = await page.$$('.ant-input-affix-wrapper');

  if(spanElements != null){
	for (const spanElement of spanElements) {
	  const inputElement = await spanElement.$('.ant-input');
	
	  // Type a text into the input element
	  await inputElement.type('sample query 26', {delay: 50});
	}
}
	

	await bot.wait(2);

	await page.waitForSelector('#threeDotMenuTrigger');
  
	// Click the div
	await page.click('#threeDotMenuTrigger');

	await bot.wait(2);


	await page.waitForSelector('li.ant-dropdown-menu-item');

	// Find the first li element with data-menu-id="schedule"
	const scheduleMenuItem = await page.$('li.ant-dropdown-menu-item[data-menu-id="schedule"]:first-of-type');
	await bot.wait(2);
  
	// Click on the li element
	await scheduleMenuItem.click();


    await bot.wait(1);

	  // wait for the input element to appear on the page
	  const emailInput = await page.waitForSelector('input[data-test-id="scheduleQueryExternalEmail"]');

	  // type the search query into the input element
	  if(emailInput) {
		await page.type('input[data-test-id="scheduleQueryExternalEmail"]', email, {delay: 50});
		}
	
	  // press the Enter key to submit the search query
	  await page.keyboard.press('Enter');

	  await bot.wait(2);

	  console.log("11111111");

	  const doneButton = await page.$('button[data-test-id="Done"]');

	  console.log("22222222222");

	  if (doneButton) {
		console.log("3333333333");

		await doneButton.click(); // Click the button

		console.log("4444444444");

	  } else {
		console.log("555555555555555");
		console.error('Button not found or not disabled');
	  }
	  console.log("66666666666");

	  await bot.wait(2);
	  console.log("7777777777");

	  const finishButton = await page.$('button[data-test-id="Finish"]');
	
	  console.log("88888888888");

	  // Click the button
	  if(finishButton) {
		console.log("99999999");

		await finishButton.click();
		console.log("12122121212");

	  }
	  await bot.wait(5);

}

export async function open_collections(bot, params){
    console.log("opening insights");
    const page = (await bot.browser.pages())[0];
    await bot.wait(4);
	const collectionIcon = await page.$('[data-test-id="CollectionIconLarge"]');

	if (collectionIcon) {
	  // click the element
	  await collectionIcon.click();
	  console.log('Clicked the collection icon!');
	} else {
	  console.log('Collection icon not found or not visible.');
	}

    // Wait for page to load
    await page.waitForNavigation();
    console.log('Page title:', await page.title());
	const inputWrapper = await page.waitForSelector('.ant-input-affix-wrapper'); // wait for the input element to be rendered

	if(inputWrapper) {
		console.log("inputWrapper");
		await page.type('.ant-input-affix-wrapper input[type="text"]', 'sample query 24', {delay: 50}); 
	} else {
		console.log("no input Wrapper");
	}
	console.log("input done");

	await bot.wait(2);
}

export async function delete_connection_in_workflow(bot, params){
	await login(bot, {atlan_username: "zine.zidane@atlan.com"});
	  // Wait for the button to appear on the page
	  await bot.wait(3);

	  const page = (await bot.browser.pages())[0];


	  const startButton = await page.waitForSelector('button[data-test-id="atlan-btn"]');

	  if(startButton){

		await startButton.click();
	  }

	  await bot.wait(3);

	  console.log("1");

	  console.log("2");

	  const element = await page.$('div.menu-item[data-v-9e6b7fc0] a[href="/workflows/marketplace"]');

	  if (element) {
		await element.click();
		console.log('Clicked on the workflow link');
	  } else {
		console.error('Element not found');
	  }

	  console.log("7");

	  await bot.wait(2);

	
	  // Wait for page to load
	  console.log("8");

	await bot.wait(4);

	console.log("9");

	const filters = await page.$('div.text-sm.capitalize[style="padding-top: 1.5px;"]');
	if (filters && (await filters.evaluate(node => node.innerText.toLowerCase().includes('all')))) {
	  await filters.click();
	} else {
	  console.log('Element not found or does not contain "All"!');
	}
	await bot.wait(3);


	const spanElements = await page.$$('.ant-input-affix-wrapper');

	console.log("10");

	if(spanElements != null){
	  for (const spanElement of spanElements) {
		const inputElement = await spanElement.$('.ant-input');
	  
		// Type a text into the input element
		await inputElement.type('delete connection', {delay: 50});
	  }
	}

	console.log("11");

	await bot.wait(2);

	const itemSpan = await page.waitForSelector('.text-sm.font-bold.truncate.cursor-pointer.text-ellipsis.text-new-blue-400');

	if(itemSpan){
	  await itemSpan.click();
	}
	await bot.wait(10);


}

export const atlan = {login, open_insights, schedule_query, open_collections, delete_connection_in_workflow};