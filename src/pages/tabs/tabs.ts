import {Component} from '@angular/core';
import {HomePage} from '../home/home';
import {MessagesPage} from '../messages/messages';
import {NotificationsPage} from '../notifications/notifications';
import {AccountPage} from '../account/account';
import {ListPage} from '../list/list';
import {IframeService} from '../../app/services/iframe.service';
import {BaseService} from '../../app/services/base.service';

@Component({
	templateUrl: 'tabs.html'
})
export class TabsPage {

	tab1Root = HomePage;
	tab2Root = MessagesPage;
	tab3Root = NotificationsPage;
	tab4Root = AccountPage;
	tab5Root = ListPage;
	messagesCount = 0;
	notificationsCount = 0;

	constructor(private _baseService: BaseService,
				private _iframeService: IframeService) {
		this.messagesCount = this._iframeService.countMessages;
		this.notificationsCount = this._iframeService.countNotifications;
	}

	currentTab(name) {
		this._baseService.currentTabActive.next(name);
	}
}
