import { Component, OnInit, OnDestroy, NgZone, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BackendService } from '../_helpers/services/backend.service';
import { VariablesService } from '../_helpers/services/variables.service';
import { ModalService } from '../_helpers/services/modal.service';
import { BigNumber } from 'bignumber.js';
import { MIXIN } from '../_shared/constants';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../_helpers/models/transaction.model';
import { MoneyToIntPipe } from '../_helpers/pipes/money-to-int.pipe';
import { finalize } from 'rxjs/operators';
import { Wallet } from '../_helpers/models/wallet.model';
import { ActivatedRoute } from '@angular/router';
import { PaginationService } from '../_helpers/services/pagination.service';
import { PaginationStore } from '../_helpers/services/pagination.store';

interface WrapInfo {
  tx_cost: {
    usd_needed_for_erc20: string;
    EvoX_needed_for_erc20: string;
  };
  unwraped_coins_left: string;
}

@Component({
  selector: 'app-acs',
  templateUrl: './acs.component.html',
  styleUrls: ['./acs.component.scss']
})
export class ACSComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('head') head: ElementRef;
  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement) {
    if (targetElement.id !== 'send-address' && this.isOpen) {
      this.isOpen = false;
    }
  }

  isOpen = false;
  localAliases = [];
  isModalDialogVisible = false;
  hideWalletAddress = false;
  mixin: number;
  wrapInfo: WrapInfo;
  isLoading = true;
  historyMessage = [];
  isWrapShown = false;
  currentAliasAdress: string;
  lenghtOfAdress: number;
  additionalOptions = false;
  parentRouting;
  actionData;
  openedDetails = '';
  calculatedWidth = [];
  calculatedWidthContact = [];
  stop_paginate = false;
  mining = false;
  walletID;
  wallet: Wallet;
  x = new BigNumber(3);
  y = new BigNumber(0.2);
  private dLActionSubscribe;
  sendForm = new FormGroup({
    address: new FormControl('', [Validators.required, (g: FormControl) => {
      this.localAliases = [];
      if (g.value) {
        this.currentAliasAdress = ''
        if (g.value.indexOf('@') !== 0) {
          this.isOpen = false;
          this.backend.validateAddress(g.value, (valid_status, data) => {
            this.ngZone.run(() => {
              this.isWrapShown = (data.error_code === 'WRAP');
              this.sendForm.get('amount').setValue(this.sendForm.get('amount').value);
              if (valid_status === false && !this.isWrapShown) {
                g.setErrors(Object.assign({ 'address_not_valid': true }, g.errors));
              } else {
                if (g.hasError('address_not_valid')) {
                  delete g.errors['address_not_valid'];
                  if (Object.keys(g.errors).length === 0) {
                    g.setErrors(null);
                  }
                }
              }
            });
          });
          return (g.hasError('address_not_valid')) ? { 'address_not_valid': true } : null;
        } else {
          this.isOpen = true;
          this.localAliases = this.variablesService.aliases.filter((item) => {
            return item.name.indexOf(g.value) > -1;
          });
          if (!(/^@?[a-z0-9\.\-]{6,25}$/.test(g.value))) {
            g.setErrors(Object.assign({ 'alias_not_valid': true }, g.errors));
          } else {
            this.backend.getAliasByName(g.value.replace('@', ''), (alias_status, alias_data) => {
              this.ngZone.run(() => {
                this.currentAliasAdress = alias_data.address
                this.lenghtOfAdress = g.value.length;
                if (alias_status) {
                  if (g.hasError('alias_not_valid')) {
                    delete g.errors['alias_not_valid'];
                    if (Object.keys(g.errors).length === 0) {
                      g.setErrors(null);
                    }
                  }
                } else {
                  g.setErrors(Object.assign({ 'alias_not_valid': true }, g.errors));
                }
              });
            });
          }
          return (g.hasError('alias_not_valid')) ? { 'alias_not_valid': true } : null;
        }
      }
      return null;
    }]),
    amount: new FormControl(undefined, [Validators.required, (g: FormControl) => {
      if (!g.value) { return null; }

      if (g.value === 0) {
        return { 'zero': true };
      }
      const bigAmount = this.moneyToInt.transform(g.value) as BigNumber;
      if (this.isWrapShown) {
        if (!this.wrapInfo) {
          return { wrap_info_null: true };
        }
        if (bigAmount.isGreaterThan(new BigNumber(this.wrapInfo.unwraped_coins_left))) {
          return { great_than_unwraped_coins: true };
        }
        if (bigAmount.isLessThan(new BigNumber(this.wrapInfo.tx_cost.EvoX_needed_for_erc20))) {
          return { less_than_EvoX_needed: true };
        }
      }
      return null;
    }]),
    comment: new FormControl(''),
    mixin: new FormControl(MIXIN, Validators.required),
    fee: new FormControl(this.variablesService.default_fee, [Validators.required, (g: FormControl) => {
      if ((new BigNumber(g.value)).isLessThan(this.variablesService.default_fee)) {
        return { 'less_min': true };
      }
      return null;
    }]),
    hide: new FormControl(false)
  });


  constructor(
    private backend: BackendService,
    public variablesService: VariablesService,
    private modalService: ModalService,
    private ngZone: NgZone,
    private http: HttpClient,
    private moneyToInt: MoneyToIntPipe,
    private route: ActivatedRoute,
    private pagination: PaginationService,
    private paginationStore: PaginationStore,
    private location: Location,
  ) {
  }

  contactAlias(address){
    if (address !== null && this.variablesService.daemon_state === 2) {
      if (this.variablesService.aliasesChecked[address] == null) {
        this.variablesService.aliasesChecked[address] = {};
        if (this.variablesService.aliases.length) {
          for (let i = 0, length = this.variablesService.aliases.length; i < length; i++) {
            if (i in this.variablesService.aliases && this.variablesService.aliases[i]['address'] === address) {
              this.variablesService.aliasesChecked[address]['name'] = this.variablesService.aliases[i].name;
              this.variablesService.aliasesChecked[address]['address'] = this.variablesService.aliases[i].address;
              this.variablesService.aliasesChecked[address]['comment'] = this.variablesService.aliases[i].comment;
              return this.variablesService.aliasesChecked[address].name;
            }
          }
        }
        this.backend.getAliasByAddress(address, (status, data) => {
          if (status) {
            this.variablesService.aliasesChecked[data.address]['name'] = '@' + data.alias;
            this.variablesService.aliasesChecked[data.address]['address'] = data.address;
            this.variablesService.aliasesChecked[data.address]['comment'] = data.comment;
          }
        });
      }
      return this.variablesService.aliasesChecked[address].name;
    }
    return {}
  }

  getShorterAdress() {
    let tempArr = this.currentAliasAdress.split("");
    return this.currentAliasAdress.split("", 34).join('') + "..." + tempArr.splice((tempArr.length - 13), 13).join('')
  }

  addressMouseDown(e) {
    if (e['button'] === 0 && this.sendForm.get('address').value && this.sendForm.get('address').value.indexOf('@') === 0) {
      this.isOpen = true;
    }
  }

  setAlias(alias) {
    this.sendForm.get('address').setValue(alias);
  }

  ngOnInit() {
    this.backend.getContactAlias();
    this.getHistoryMessage();

    /*------------------------history-----------------------*/
    this.parentRouting = this.route.parent.params.subscribe(() => {
      this.openedDetails = '';
    });
    let restore = false;
    if (this.variablesService.after_sync_request.hasOwnProperty(this.variablesService.currentWallet.wallet_id)) { restore = this.variablesService.after_sync_request[this.variablesService.currentWallet.wallet_id]; }
    if (!this.variablesService.sync_started && restore && this.variablesService.currentWallet.wallet_id) {
      this.wallet = this.variablesService.getNotLoadedWallet();
      if (this.wallet) {
        this.tick();
      }
      this.getRecentTransfers();
      this.variablesService.after_sync_request[this.variablesService.currentWallet.wallet_id] = false;
    }
    let after_sync_request = false;
    if (
      this.variablesService.after_sync_request.hasOwnProperty(this.variablesService.currentWallet.wallet_id)
    ) {
      after_sync_request = this.variablesService.after_sync_request[
        this.variablesService.currentWallet.wallet_id
      ];
    }
    if (after_sync_request && !this.variablesService.sync_started) {
      this.getRecentTransfers();
    }

    if (this.variablesService.stop_paginate.hasOwnProperty(this.variablesService.currentWallet.wallet_id)) {
      this.stop_paginate = this.variablesService.stop_paginate[this.variablesService.currentWallet.wallet_id];
    } else {
      this.stop_paginate = false;
    }
    this.wallet = this.variablesService.getNotLoadedWallet();
    if (this.wallet) {
      this.tick();
    }
    this.mining = this.variablesService.currentWallet.exclude_mining_txs;

    /*-----------------------Send--------------------------*/

    this.mixin = this.variablesService.currentWallet.send_data['mixin'] || MIXIN;
    if (this.variablesService.currentWallet.is_auditable) {
      this.mixin = 0;
      this.sendForm.controls['mixin'].disable();
    }
    this.hideWalletAddress = this.variablesService.currentWallet.is_auditable && !this.variablesService.currentWallet.is_watch_only;
    if (this.hideWalletAddress) {
      this.sendForm.controls['hide'].disable();
    }
    this.sendForm.reset({
      address: this.variablesService.currentWallet.send_data['address'],
      amount: this.variablesService.currentWallet.send_data['amount'],
      comment: this.variablesService.currentWallet.send_data['comment'],
      mixin: this.mixin,
      fee: this.variablesService.currentWallet.send_data['fee'] || this.variablesService.default_fee,
      hide: this.variablesService.currentWallet.send_data['hide'] || false
    });

    this.getWrapInfo();
    this.dLActionSubscribe = this.variablesService.sendActionData$.subscribe((res) => {
      if (res.action === "send") {
        this.actionData = res
        setTimeout(() => {
          this.fillDeepLinkData()
        }, 100)
        this.variablesService.sendActionData$.next({});
      }
    })
  }
  /*------------------------------------------history------------------------------------*/
  ngAfterViewChecked() {
    this.calculateWidth();
  }

  strokeSize(item) {
    const rem = this.variablesService.settings.scale
    if ((this.variablesService.height_app - item.height >= 10 && item.height !== 0) || (item.is_mining === true && item.height === 0)) {
      return 0;
    } else {
      if (item.height === 0 || this.variablesService.height_app - item.height < 0) {
        return (4.5 * rem);
      } else {
        return ((4.5 * rem) - (((4.5 * rem) / 100) * ((this.variablesService.height_app - item.height) * 10)));
      }
    }
  }

  resetPaginationValues() {
    this.ngZone.run(() => {
      const total_history_item = this.variablesService.currentWallet
        .total_history_item;
      const count = this.variablesService.count;
      this.variablesService.currentWallet.totalPages = Math.ceil(
        total_history_item / count
      );
      this.variablesService.currentWallet.exclude_mining_txs = this.mining;
      this.variablesService.currentWallet.currentPage = 1;

      if (!this.variablesService.currentWallet.totalPages) {
        this.variablesService.currentWallet.totalPages = 1;
      }
      this.variablesService.currentWallet.totalPages >
        this.variablesService.maxPages
        ? (this.variablesService.currentWallet.pages = new Array(5)
          .fill(1)
          .map((value, index) => value + index))
        : (this.variablesService.currentWallet.pages = new Array(
          this.variablesService.currentWallet.totalPages
        )
          .fill(1)
          .map((value, index) => value + index));
    });
  }


  setPage(pageNumber: number) {
    // this is will allow pagination for wallets that was open from existed wallets'
    if (pageNumber === this.variablesService.currentWallet.currentPage) {
      return;
    }
    if (
      this.variablesService.currentWallet.open_from_exist &&
      !this.variablesService.currentWallet.updated
    ) {
      this.variablesService.get_recent_transfers = false;
      this.variablesService.currentWallet.updated = true;
    }
    // if not running get_recent_transfers callback
    if (!this.variablesService.get_recent_transfers) {
      this.variablesService.currentWallet.currentPage = pageNumber;
    }
    if (!this.variablesService.get_recent_transfers) {
      this.getRecentTransfers();
    }
  }

  toggleMiningTransactions() {
    if (!this.variablesService.sync_started && !this.wallet) {
      const value = this.paginationStore.value;
      if (!value) {
        this.paginationStore.setPage(1, 0, this.variablesService.currentWallet.wallet_id); // add back page for the first page
      } else {
        const pages = value.filter((item) => item.walletID === this.variablesService.currentWallet.wallet_id);
        if (!pages.length) {
          this.paginationStore.setPage(1, 0, this.variablesService.currentWallet.wallet_id); // add back page for the first page
        }
      }
      this.mining = !this.mining;
      this.resetPaginationValues();
      this.getRecentTransfers();
    }
  }

  getRecentTransfers() {
    const offset = this.pagination.getOffset(this.variablesService.currentWallet.wallet_id);
    const value = this.paginationStore.value;
    const pages = value
      ? value.filter((item) => item.walletID === this.variablesService.currentWallet.wallet_id)
      : [];

    this.backend.getRecentTransfers(
      this.variablesService.currentWallet.wallet_id,
      offset,
      this.variablesService.count,
      this.variablesService.currentWallet.exclude_mining_txs,
      (status, data) => {
        const isForward = this.paginationStore.isForward(
          pages,
          this.variablesService.currentWallet.currentPage
        );
        if (this.mining && isForward && pages && pages.length === 1) {
          this.variablesService.currentWallet.currentPage = 1; // set init page after navigation back
        }

        const history = data && data.history;
        this.variablesService.stop_paginate[this.variablesService.currentWallet.wallet_id] =
          (history && history.length < this.variablesService.count) || !history;
        this.stop_paginate = this.variablesService.stop_paginate[this.variablesService.currentWallet.wallet_id];
        if (!this.variablesService.stop_paginate[this.variablesService.currentWallet.wallet_id]) {
          const page = this.variablesService.currentWallet.currentPage + 1;
          if (
            isForward &&
            this.mining &&
            history &&
            history.length === this.variablesService.count
          ) {
            this.paginationStore.setPage(
              page,
              data.last_item_index,
              this.variablesService.currentWallet.wallet_id
            ); // add back page for current page
          }
        }

        this.pagination.calcPages(data);
        this.pagination.prepareHistory(data, status);

        this.ngZone.run(() => {
          this.variablesService.get_recent_transfers = false;
          if (
            this.variablesService.after_sync_request.hasOwnProperty(
              this.variablesService.currentWallet.wallet_id
            )
          ) {
            // this is will complete get_recent_transfers request
            // this will switch of
            this.variablesService.after_sync_request[this.variablesService.currentWallet.wallet_id] = false;
          }
        });
      }
    );
  }

  getHistoryMessage() {
    for (let item of this.variablesService.currentWallet.history){
      if (item.comment[0] == 'A' && item.comment[1] == 'C' && item.comment[2] == 'S' && item.comment[3] == ':'){
        this.historyMessage.push(item)
      } else {continue}
    }
  }

  tick() {
    const walletInterval = setInterval(() => {
      this.wallet = this.variablesService.getNotLoadedWallet();
      if (!this.wallet) {
        clearInterval(walletInterval);
      }
    }, 1000);
  }

  getHeight(item) {
    if ((this.variablesService.height_app - item.height >= 10 && item.height !== 0) || (item.is_mining === true && item.height === 0)) {
      return 10;
    } else {
      if (item.height === 0 || this.variablesService.height_app - item.height < 0) {
        return 0;
      } else {
        return (this.variablesService.height_app - item.height);
      }
    }
  }

  openDetails(tx_hash) {
    if (tx_hash === this.openedDetails) {
      this.openedDetails = '';
    } else {
      this.openedDetails = tx_hash;
    }
  }

  calculateWidth() {
    this.calculatedWidth = [];
    this.calculatedWidth.push(this.head.nativeElement.childNodes[0].clientWidth);
    this.calculatedWidth.push(this.head.nativeElement.childNodes[1].clientWidth + this.head.nativeElement.childNodes[2].clientWidth);
  }

  time(item: Transaction) {
    const now = new Date().getTime();
    const unlockTime = now + ((item.unlock_time - this.variablesService.height_max) * 60 * 1000);
    return unlockTime;
  }

  isLocked(item: Transaction) {
    if ((item.unlock_time > 500000000) && (item.unlock_time > new Date().getTime() / 1000)) {
      return true;
    }
    if ((item.unlock_time < 500000000) && (item.unlock_time > this.variablesService.height_max)) {
      return true;
    }
    return false;
  }


  /*------------------------------------------send----------------------------------*/
  private getWrapInfo() {
    this.http.get<WrapInfo>('#')
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe(info => {
        this.wrapInfo = info;
      });
  }

  showDialog() {
    this.isModalDialogVisible = true;
  }

  confirmed(confirmed: boolean) {
    if (confirmed) {
      this.onSend();
    }
    this.isModalDialogVisible = false;
  }

  fillDeepLinkData() {
    this.additionalOptions = true;
    this.sendForm.reset({
      address: this.actionData.address,
      amount: null,
      comment: this.actionData.comment || this.actionData.comments || '',
      mixin: this.actionData.mixins || this.mixin,
      fee: this.actionData.fee || this.variablesService.default_fee,
      hide: this.actionData.hide_sender === "true" ? true : false
    });
  }

  payMessage(){
    let pay = Number(this.sendForm.get('amount').value) + 0.001
    return String(pay)
  }

  onSend() {
    if (this.sendForm.valid) {
      if (this.sendForm.get('address').value.indexOf('@') !== 0) {
        this.backend.validateAddress(this.sendForm.get('address').value, (valid_status, data) => {
          console.log(valid_status, data.error_code === 'WRAP');
          if (valid_status === false && !(data.error_code === 'WRAP')) {
            this.ngZone.run(() => {
              this.sendForm.get('address').setErrors({ 'address_not_valid': true });
            });
          } else {
            console.log(this.sendForm.get('amount').value)
            this.backend.sendMoney(
              this.variablesService.currentWallet.wallet_id,
              this.sendForm.get('address').value,
              this.payMessage(),
              this.sendForm.get('fee').value,
              this.sendForm.get('mixin').value,
              'ACS: ' + this.sendForm.get('comment').value,
              this.sendForm.get('hide').value,
              (send_status) => {
                if (send_status) {
                  this.modalService.prepareModal('success', 'SEND.SUCCESS_SENT');
                  this.variablesService.currentWallet.send_data = {
                    address: null,
                    amount: null,
                    comment: null,
                    mixin: null,
                    fee: null,
                    hide: null
                  };
                  this.sendForm.reset({
                    address: null,
                    amount: null,
                    comment: null,
                    mixin: this.mixin,
                    fee: this.variablesService.default_fee,
                    hide: false
                  });
                }
              });
          }
        });
      } else {
        this.backend.getAliasByName(this.sendForm.get('address').value.replace('@', ''), (alias_status, alias_data) => {
          this.ngZone.run(() => {
            if (alias_status === false) {
              this.ngZone.run(() => {
                this.sendForm.get('address').setErrors({ 'alias_not_valid': true });
              });
            } else {
              console.log(this.sendForm.get('amount').value)
              this.backend.sendMoney(
                this.variablesService.currentWallet.wallet_id,
                alias_data.address, // this.sendForm.get('address').value,
                this.payMessage(),
                this.sendForm.get('fee').value,
                this.sendForm.get('mixin').value,
                'ACS: ' + this.sendForm.get('comment').value,
                this.sendForm.get('hide').value,
                (send_status) => {
                  if (send_status) {
                    this.modalService.prepareModal('success', 'SEND.SUCCESS_SENT');
                    this.variablesService.currentWallet.send_data = {
                      address: null,
                      amount: null,
                      comment: null,
                      mixin: null,
                      fee: null,
                      hide: null
                    };
                    this.sendForm.reset({
                      address: null,
                      amount: null,
                      comment: null,
                      mixin: this.mixin,
                      fee: this.variablesService.default_fee,
                      hide: false
                    });
                  }
                });
            }
          });
        });
      }
    }
  }
  
  toggleOptions() {
    this.additionalOptions = !this.additionalOptions;
  }

  ngOnDestroy() {
    this.parentRouting.unsubscribe();
    this.dLActionSubscribe.unsubscribe();
    this.variablesService.currentWallet.send_data = {
      address: this.sendForm.get('address').value,
      amount: this.sendForm.get('amount').value,
      comment: this.sendForm.get('comment').value,
      mixin: this.sendForm.get('mixin').value,
      fee: this.sendForm.get('fee').value,
      hide: this.sendForm.get('hide').value
    };
    this.actionData = {},
    this.historyMessage = []
  }

  public getReceivedValue() {
    const amount = this.moneyToInt.transform(this.sendForm.value.amount);
    const needed = new BigNumber(this.wrapInfo.tx_cost.EvoX_needed_for_erc20);
    if (amount && needed) { return (amount as BigNumber).minus(needed); }
    return 0;
  }

  /*------------------------------contact------------------------------*/
  delete(index: number) {
    if (this.variablesService.appPass) {
      this.variablesService.contacts.splice(index, 1);
      this.backend.storeSecureAppData();
    }
  }

  copy(value) {
    this.backend.setClipboard(value);
  }

  calculateWidthContact() {
    this.calculatedWidthContact = [];
    this.calculatedWidthContact.push(
      this.head.nativeElement.childNodes[0].clientWidth
    );
    this.calculatedWidthContact.push(
      this.head.nativeElement.childNodes[1].clientWidth +
      this.head.nativeElement.childNodes[2].clientWidth
    );
    this.calculatedWidthContact.push(
      this.head.nativeElement.childNodes[3].clientWidth
    );
    this.calculatedWidthContact.push(
      this.head.nativeElement.childNodes[4].clientWidth
    );
  }

  back() {
    this.location.back();
  }
}

