import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-acs',
  templateUrl: './acs.component.html',
  styleUrls: ['./acs.component.scss']
})
export class ACSComponent implements OnInit {

  messages = [
    {
      is_new: true,
      address: '@bitmap',
      message: 'No more miners for you!'
    },
    {
      is_new: false,
      address: 'Hjkwey36gHasdhkajshd4bxnb5mcvowyefb2633FdsFGGWbb',
      message: 'Hey! What’s with our BBR deal?'
    },
    {
      is_new: false,
      address: '@john',
      message: 'I’m coming!'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
