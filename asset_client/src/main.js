/**
 * Copyright 2017 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 */
'use strict';

// These requires inform webpack which styles to build
require('bootstrap');
require('../styles/main.scss');

const m = require('mithril');

const api = require('./services/api');
const transactions = require('./services/transactions');
const navigation = require('./components/navigation');

const AddAssetForm = require('./views/add_asset_form');
const AddFacilityForm = require('./views/add_facility_form');
const AddItemForm = require('./views/add_item');
const AgentDetailPage = require('./views/agent_detail');
const AgentList = require('./views/list_agents');
const AssetList = require('./views/list_assets');
const AssetDetail = require('./views/asset_detail');
const Dashboard = require('./views/dashboard');
const FacilityDetail = require('./views/facility_detail');
const FacilityList = require('./views/list_facilities');
const ItemDetail = require('./views/item_detail');
const ItemList = require('./views/list_items');
const LoginForm = require('./views/login_form');
const PropertyDetailPage = require('./views/property_detail');
const SignupForm = require('./views/signup_form');

/**
 * A basic layout component that adds the navbar to the view.
 */
const Layout = {
  view (vnode) {
    return [
      vnode.attrs.navbar,
      m('.content.container', vnode.children)
    ]
  }
}

const loggedInNav = () => {
  const links = [
    ['/create', 'Add Asset'],
    ['/addFacility', 'Add Facility'],
    ['/addItem', 'Add Item'],
    ['/assets', 'View Assets'],
    ['/facilities', 'View Facilities'],
    ['/items', 'View Items'],
    ['/agents', 'View Agents']
  ];
  return m(navigation.Navbar, {}, [
    navigation.links(links),
    navigation.link('/profile', 'Profile'),
    navigation.button('/logout', 'Logout')
  ])
}

const loggedOutNav = () => {
  const links = [
    ['/assets', 'View Assets'],
    ['/agents', 'View Agents']
  ]
  return m(navigation.Navbar, {}, [
    navigation.links(links),
    navigation.button('/login', 'Login/Signup')
  ])
}

/**
 * Returns a route resolver which handles authorization related business.
 */
const resolve = (view, restricted = false) => {
  const resolver = {}

  if (restricted) {
    resolver.onmatch = () => {
      if (api.getAuth()) return view
      m.route.set('/login')
    };
  }

  resolver.render = vnode => {
    if (api.getAuth()) {
      return m(Layout, { navbar: loggedInNav() }, m(view, vnode.attrs));
    }
    return m(Layout, { navbar: loggedOutNav() }, m(view, vnode.attrs));
  };

  return resolver;
};

/**
 * Clears user info from memory/storage and redirects.
 */
const logout = () => {
  api.clearAuth();
  transactions.clearPrivateKey();
  m.route.set('/');
}

/**
 * Redirects to user's agent page if logged in.
 */
const profile = () => {
  const publicKey = api.getPublicKey()
  if (publicKey) m.route.set(`/agents/${publicKey}`)
  else m.route.set('/')
}

/**
 * Build and mount app/router
 */
document.addEventListener('DOMContentLoaded', () => {
  m.route(document.querySelector('#app'), '/', {
    '/': resolve(Dashboard),
    '/agents/:publicKey': resolve(AgentDetailPage),
    '/agents': resolve(AgentList),
    '/create': resolve(AddAssetForm, true),
    '/assets': resolve(AssetList),
    '/assets/:recordId': resolve(AssetDetail),
    '/assets/:recordId/:name': resolve(PropertyDetailPage),
    '/addFacility': resolve(AddFacilityForm, true),
    '/facilities': resolve(FacilityList),
    '/facilities/:recordId': resolve(FacilityDetail),
    '/facilities/:recordId/:name': resolve(PropertyDetailPage), //TODO Might need seperate property detail page for facility
    '/addItem': resolve(AddItemForm, true),
    '/items': resolve(ItemList),
    '/items/:recordId': resolve(ItemDetail),
    '/items/:recordId/:name': resolve(PropertyDetailPage), //TODO Might need seperate property detail page for facility
    '/login': resolve(LoginForm),
    '/logout': { onmatch: logout },
    '/profile': { onmatch: profile },
    '/signup': resolve(SignupForm)
  })
})