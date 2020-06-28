import {Injectable, NgZone, ApplicationRef} from '@angular/core';
import {InAppBrowser, InAppBrowserOptions, InAppBrowserEvent} from '@ionic-native/in-app-browser';
import {AppSettings} from '../../const';
import {BaseService} from './base.service';
import {Network} from '@ionic-native/network';
import {Platform} from 'ionic-angular';
import {AuthService} from './auth.service';
import {NgProgress} from '@ngx-progressbar/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class IframeService {

	webShow: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
	menuTabs = [];
	menuList = [];

	private _messages = 0;
	private _notifications = 0;
	private _apiUrl = AppSettings.BASE_API_URL;

	constructor(private _iab: InAppBrowser,
				private _baseService: BaseService,
				private _authService: AuthService,
				private _progressBar: NgProgress,
				private _applicationRef: ApplicationRef,
				private _network: Network,
				private _platform: Platform,
				private _ngZone: NgZone) {
		this._listenForMessage(this);

		_platform.ready().then(() => {
			this.checkNetworkSts();
		});
	}

	get countMessages() {
		return this._messages;
	}

	get countNotifications() {
		return this._notifications;
	}

	getTabUrl(index) {
		return this.menuTabs[index].url;
	}

	listenMessage(msg) {
		const obj = msg.data.data;

		if (obj.notifications || obj.messages) {
			this._notifications = Number(obj.notifications);
			this._messages = Number(obj.messages);
		} else if (!obj.isExternal && obj.nextUrl && obj.nextUrl !== '#') {
			this._progressBar.start();
		} else if (obj.isExternal) {
			this.initIAB(obj.externalUrl);
			this._progressBar.start();
			setTimeout(() => {
				this._baseService.updateCurrentTabIframeSrc(obj.currentUrl);
			}, 500);
		}
	}

	showFakeItems() {
		Array.from(document.getElementsByClassName('fake-items')).forEach(function (element) {
			element.classList.remove('display-none');
		});
		Array.from(document.getElementsByClassName('real-items')).forEach(function (element) {
			element.classList.add('display-none');
		});
	}

	hideFakeItems() {
		Array.from(document.getElementsByClassName('fake-items')).forEach(function (element) {
			element.classList.add('display-none');
		});
		Array.from(document.getElementsByClassName('real-items')).forEach(function (element) {
			element.classList.remove('display-none');
		});
	}

	getHostName(url) {
		const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);

		if (match !== null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
			return match[2];
		} else {
			return null;
		}
	}

	isExternal(url) {
		return this.getHostName(url) !== this.getHostName(this._apiUrl);
	}

	isPaymentPage(url) {
		const match = url.match(/(\?pay_for_item)/i);

		return match !== null;
	}

	iframeLoaded() {
		this._baseService.dismissLoading();
		this._progressBar.complete();
		this.hideFakeItems();
	}

	checkNetworkSts() {
		if (this._network.type === 'none') {
			this.webShow.next(false);
		} else {
			this._populateMenuTabs();
		}

		this._network.onchange()
			.subscribe(resp => {
				this._ngZone.run(() => {
					this.webShow.next(resp.type === 'online');
				});

				if (this.webShow.getValue()) {
					this._populateMenuTabs();
				}
			});
	}

	initIAB(url) {
		const iabOpts: InAppBrowserOptions = {
			zoom: 'no',
			location: 'yes'
		};

		var browser = this._iab.create(url, '_blank', iabOpts);

		if (browser.on('loadstart').subscribe) {
			browser.on('loadstart').subscribe((e: InAppBrowserEvent) => {
				if (e && e.url) {
					url = e.url;
					if (!this.isExternal(url) && !this.isPaymentPage(url)) {
						this._baseService.updateCurrentTabIframeSrc(url);
						browser.close();
					}
				}
			});
		}
	}

	private _listenForMessage(self) {
		const iframeService = this;

		window.addEventListener('message', function (e) {
			self._applicationRef.tick();
			iframeService.listenMessage(e);
		}, false);
	}

	private _populateMenuTabs() {
		this._authService
			.fetchApiOptions()
			.subscribe(resp => {
				this.menuTabs = resp['menutabs'];
				this.menuList = resp['menulist'];
			});
	}

}
