var config = {
	CHROME_WEBSTORE_ID: "jgnchehlaggacipokckdlbdemfeohdhc",
	GA_STAT_ID: "UA-20919085-7", // Google Analytics

	get NAME() {
		var name;

		try {
			name = chrome.runtime.getManifest().name;
		} catch (e) {
			name = chrome.i18n.getMessage("appName");
		}

		delete this.NAME;
		return this.NAME = name;
	},

	get ID() {
		var id;

		try {
			id = chrome.runtime.id;
		} catch (e) {
			id = chrome.i18n.getMessage("@@extension_id");
		}

		delete this.ID;
		return this.ID = id;
	},

	get VERSION() {
		var version;

		try {
			version = chrome.runtime.getManifest().version;
		} catch (e) {
			version = chrome.app.getDetails().version;
		}

		delete this.VERSION;
		return this.VERSION = version;
	},

	get DEBUG() {
		return (this.CHROME_WEBSTORE_ID !== this.ID);
	}
};
