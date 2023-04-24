// Learn more about destination functions API at
// https://segment.com/docs/connections/destinations/destination-functions

let token_expiry_ms = 10 * 60 * 1000; // start with 10 minutes
let token = null;
async function getAccessToken(settings) {
	const now = new Date().getTime();
	if (!token || now - token.ts > token_expiry_ms) {
		const auth_payload = {
			grant_type: 'client_credentials',
			client_id: settings.clientid,
			client_secret: settings.clientsecret,
			scope: 'journeys_read list_and_subscribers_read',
			account_id: settings.sfmcmid
		};

		const resp = await fetch(settings.sfmcAuthenticationEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(auth_payload)
		}).then(resp => resp.json());
		token_expiry_ms = resp.expires_in * 1000; // set token expiry time
		token = {
			ts: now,
			value: resp.access_token
		};
	}
	return token.value;
}

/**
 * Handle identify event
 * @param  {SegmentIdentifyEvent} event
 * @param  {FunctionSettings} settings
 */
async function onIdentify(event, settings) {
	const journey_payload = {
		ContactKey: event.userId,
		EventDefinitionKey: settings.sfmcJourneyKey,
		Data: {
			userid: event.userId,
			email: event.traits.email,
			name: event.traits.name,
			industry: event.traits.company.industry
		}
	};
	const sfmctoken = await getAccessToken(settings);
	console.log(sfmctoken);
	console.log(JSON.stringify(journey_payload));
	let response;
	try {
		response = await fetch(settings.sfmcPostJourneyEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${sfmctoken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(journey_payload)
		});
	} catch (error) {
		// Retry on connection error
		throw new RetryError(error.message);
	}

	if (response.status >= 500 || response.status === 429) {
		// Retry on 5xx (server errors) and 429s (rate limits)
		throw new RetryError(`Failed with ${response.status}`);
	}
}

/**
 * Handle track event
 * @param  {SegmentTrackEvent} event
 * @param  {FunctionSettings} settings
 */
async function onTrack(event, settings) {
	// Learn more at https://segment.com/docs/connections/spec/track/
	throw new EventNotSupported('track is not supported');
}

/**
 * Handle group event
 * @param  {SegmentGroupEvent} event
 * @param  {FunctionSettings} settings
 */
async function onGroup(event, settings) {
	// Learn more at https://segment.com/docs/connections/spec/group/
	throw new EventNotSupported('group is not supported');
}

/**
 * Handle page event
 * @param  {SegmentPageEvent} event
 * @param  {FunctionSettings} settings
 */
async function onPage(event, settings) {
	// Learn more at https://segment.com/docs/connections/spec/page/
	throw new EventNotSupported('page is not supported');
}

/**
 * Handle screen event
 * @param  {SegmentScreenEvent} event
 * @param  {FunctionSettings} settings
 */
async function onScreen(event, settings) {
	// Learn more at https://segment.com/docs/connections/spec/screen/
	throw new EventNotSupported('screen is not supported');
}

/**
 * Handle alias event
 * @param  {SegmentAliasEvent} event
 * @param  {FunctionSettings} settings
 */
async function onAlias(event, settings) {
	// Learn more at https://segment.com/docs/connections/spec/alias/
	throw new EventNotSupported('alias is not supported');
}

/**
 * Handle delete event
 * @param  {SegmentDeleteEvent} event
 * @param  {FunctionSettings} settings
 */
async function onDelete(event, settings) {
	// Learn more at https://segment.com/docs/partners/spec/#delete
	throw new EventNotSupported('delete is not supported');
}
