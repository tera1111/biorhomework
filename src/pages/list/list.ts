import {Component, OnDestroy, OnInit} from '@angular/core';
import {IframeService} from '../../app/services/iframe.service';
import {DomSanitizer} from '@angular/platform-browser';
import {NgProgress} from '@ngx-progressbar/core';
import {Subscription} from 'rxjs/Subscription';
import {BaseService} from '../../app/services/base.service';
import {LoginPage} from '../login/login';
import {AuthService} from '../../app/services/auth.service';
import {AlertController, NavController} from 'ionic-angular';

@Component({
	selector: 'page-list',
	templateUrl: 'list.html'
})
export class ListPage implements OnInit, OnDestroy {

	iframeSrc: any;
	webShow = false;
	menuList: any[];
	private _tabUrl = '';
	private _srcSubscription: Subscription;

	constructor(private _baseService: BaseService,
				private _progressBar: NgProgress,
				private _alertCtrl: AlertController,
				private _authService: AuthService,
				private _domSanitizer: DomSanitizer,
				private _navCtrl: NavController,
				private _iframeService: IframeService) {
		this.menuList = _iframeService.menuList;
		this._subscribeToSrcChange();
	}

	ngOnInit() {
		this._progressBar.start();
		this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(`${this._tabUrl}`);
	}

	ionSelected() {
		this._progressBar.start();
		this.webShow = false;
		this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(`${this._tabUrl}`);
	}

	goTo(page) {
		this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(page);
		this.webShow = true;
	}

	progressBarComplete() {
		this._iframeService.iframeLoaded();
	}

	logout() {
		this._baseService.createLoading();
		this._authService
			.logout()
			.subscribe(() => {
					this._baseService.dismissLoading();
					this._navCtrl.parent.parent.setRoot(LoginPage);
				},
				err => {
					let alert = this._alertCtrl.create({
						subTitle: err.error.message,
						buttons: ['OK']
					});
					alert.present();
					this._baseService.dismissLoading();
				});
	}

	private _subscribeToSrcChange() {
		this._srcSubscription = this._baseService.listIframeSrc
			.subscribe(val => {
				this._progressBar.start();
				this.iframeSrc = this._domSanitizer.bypassSecurityTrustResourceUrl(val);
			});
	}

	ngOnDestroy() {
		if (this._srcSubscription) {
			this._srcSubscription.unsubscribe();
		}
	}

}
