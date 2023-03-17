import { Component, OnInit, OnDestroy, NgZone, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BackendService } from '../_helpers/services/backend.service';
import { VariablesService } from '../_helpers/services/variables.service';
import { ModalService } from '../_helpers/services/modal.service';
import { BigNumber } from 'bignumber.js';
import { MIXIN } from '../_shared/constants';
import { HttpClient } from '@angular/common/http';
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
export class ACSComponent implements OnInit {
  [x: string]: any;
  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement) {
    if (targetElement.id !== 'send-address' && this.isOpen) {
      this.isOpen = false;
    }
  }
  @ViewChild('head') head: ElementRef;

  openedDetails = '';
  calculatedWidth = [];
  stop_paginate = false;
  mining = false;
  walletID;
  wallet: Wallet;
  x = new BigNumber(3);
  y = new BigNumber(0.2);
  isOpen = false;
  localAliases = [];
  isModalDialogVisible = false;
  hideWalletAddress = false;
  mixin: number;
  wrapInfo: WrapInfo;
  isLoading = true;
  isWrapShown = false;
  currentAliasAdress: string;
  lenghtOfAdress: number;
  additionalOptions = false;
  parentRouting;
  actionData;
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
    private pagination: PaginationService,
    private moneyToInt: MoneyToIntPipe,
    private route: ActivatedRoute,
    private paginationStore: PaginationStore,
  ) {
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
    this.sendForm.reset({
      address: this.variablesService.currentWallet.send_data['address'],
      comment: this.variablesService.currentWallet.send_data['comment'],
    });

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
      // if this is was restore wallet and it was selected on moment when sync completed
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
      // if user click on the wallet at the first time after restore.
      this.getRecentTransfers();
    }

    if (this.variablesService.stop_paginate.hasOwnProperty(this.variablesService.currentWallet.wallet_id)) {
      this.stop_paginate = this.variablesService.stop_paginate[this.variablesService.currentWallet.wallet_id];
    } else {
      this.stop_paginate = false;
    }
    // this will hide pagination a bit earlier
    this.wallet = this.variablesService.getNotLoadedWallet();
    if (this.wallet) {
      this.tick();
    }

    function getRecentTransfers() {
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

  tick() {
    const walletInterval = setInterval(() => {
      this.wallet = this.variablesService.getNotLoadedWallet();
      if (!this.wallet) {
        clearInterval(walletInterval);
      }
    }, 1000);
  }

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
      comment: this.actionData.comment || this.actionData.comments || '',
    });
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
            this.backend.sendMoney(
              this.variablesService.currentWallet.wallet_id,
              this.sendForm.get('address').value,
              this.sendForm.get('0.01').value,
              this.sendForm.get('0.01').value,
              this.sendForm.get('10').value,
              this.sendForm.get('comment').value,
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
              this.backend.sendMoney(
                this.variablesService.currentWallet.wallet_id,
                alias_data.address, // this.sendForm.get('address').value,
                this.sendForm.get('amount').value,
                this.sendForm.get('0.01').value,
                this.sendForm.get('0.01').value,
                this.sendForm.get('comment').value,
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
    this.dLActionSubscribe.unsubscribe();
    this.variablesService.currentWallet.send_data = {
      address: this.sendForm.get('address').value,
      comment: this.sendForm.get('comment').value,
    };
    this.actionData = {}
  }

  public getReceivedValue() {
    const amount = this.moneyToInt.transform(this.sendForm.value.amount);
    const needed = new BigNumber(this.wrapInfo.tx_cost.EvoX_needed_for_erc20);
    if (amount && needed) { return (amount as BigNumber).minus(needed); }
    return 0;
  }
}
function getRecentTransfers() {
  throw new Error('Function not implemented.');
}

