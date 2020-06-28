import {Component, OnDestroy, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppSettings} from '../../const';
import {BaseService} from '../../app/services/base.service';
import {Subscription} from 'rxjs/Subscription';
import {IframeService} from '../../app/services/iframe.service';
import {NgProgress} from '@ngx-progressbar/core';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage implements OnDestroy, OnInit {

	iframeSrc: any;
	webShow = true;
	private _apiUrl = AppSettings.BASE_API_URL;
	private _srcSubscription: Subscription;
	private _networkStsSubscription: Subscription;

	constructor(private _baseService: BaseService,
				private _progressBar: NgProgress,
				private _iframeService: IframeService,
				private _domSanitizer: DomSanitizer) {
		this._subscribeToSrcChange();
		this._subscribeToNetworkStsChange();
		this._baseService.currentTabActive.next('home');
	}

	ngOnInit() {
		this._progressBar.start();
		this._iframeService.showFakeItems();
		this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(`${this._apiUrl}/wp-json/wpjobster/v1/login/${localStorage.getItem('jst__tok')}`);
	}

	ionSelected() {
		this._progressBar.start();
		this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(`${this._apiUrl}`);
	}

	progressBarComplete() {
		this._iframeService.iframeLoaded();
	}

	private _subscribeToSrcChange() {
		this._srcSubscription = this._baseService.homeIframeSrc
			.subscribe(val => {
				this._progressBar.start();
				this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(val);
			});
	}

	private _subscribeToNetworkStsChange() {
		this._networkStsSubscription = this._iframeService.webShow
			.subscribe(val => {
				this.webShow = val;
				if (val) {
					this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(this.iframeSrc.changingThisBreaksApplicationSecurity);
				}
			});
	}

	ngOnDestroy() {
		if (this._srcSubscription) {
			this._srcSubscription.unsubscribe();
		}
		if (this._networkStsSubscription) {
			this._networkStsSubscription.unsubscribe();
		}
	}

}
