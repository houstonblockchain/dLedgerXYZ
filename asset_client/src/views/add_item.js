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

const m = require('mithril');
const _ = require('lodash');
const mSelect = require('mithril-select');

// UTILITIES IMPORTS
const api = require('../services/api');
const payloads = require('../services/payloads');
const transactions = require('../services/transactions');
const parsing = require('../services/parsing');
const itemCatArrayObj = require('../components/itemCategories');
const generateUid = require('../utils/uidGenerator')

//CSS IMPORTS
const forms = require('../components/forms')
const layout = require('../components/layout')


/**
 * Possible selection options
 */
const authorizableProperties = [
  ['itemName', 'Item Name'],
  ['itemType', 'Item Type'],
  ['quantity', 'Quantity'],
  ['unitOfMeasure', 'Unit of Measure'],
  ['itemCategory', 'Item Category']
]

/**
 * The Form for tracking a new asset.
 */
const AddItemForm = {
  oninit(vnode) {
    // Initialize the empty reporters fields
    vnode.state.reporters = [
      {
        reporterKey: '',
        properties: []
      }
    ]
    api.get('agents')
      .then(agents => {
        const publicKey = api.getPublicKey()
        vnode.state.agents = agents.filter(agent => agent.key !== publicKey)
      })
  },

  view(vnode) {
    
    const setter = forms.stateSetter(vnode.state);
    //let itemCategory = setter('itemCategory')('');
    const setts = (sett, vals) => {
      return setter(sett)(vals);
    }
    return [
      m('.add_item_form',
        m('form', {
          onsubmit: (e) => {
            e.preventDefault()
            _handleSubmit(vnode.attrs.signingKey, vnode.state)
          }
        },
          m('legend', 'Add Item'),
          layout.row(
            [
              forms.textInput(setter('itemName'), 'Item Name'),
              forms.textInput(setter('itemType'), 'Item Type'),
              
            ]
          ),

          layout.row(
            [
              forms.group('Quantity', forms.field(setter('quantity'), {
                type: 'number',
                step: 'any',
                required: true,
                placeholder: 'Eg: 0.232'
              })),
              forms.textInput(setter('unitOfMeasure'), 'Unit of Measure')
            ]
          ),
          /**
           * itemID state and value is set:
           */
          setter('itemID')(generateUid('Item-')),
          
          /**
           * Select dropdown for item categories
           */
          forms.group('Item Category: ',
            m(mSelect,{
              options: [
                {value: '', view: 'Select an Item Category'}
              ].concat(itemCatArrayObj.map(c => ({value: c.id, view: c.text}))
            ),
            onchange: (val) =>{
              itemCategory = !!val
                ? itemCatArrayObj.find(c => c.id === val).text
                : '';
            }
            })

          )
          ),
          m('.reporters.form-group',
            m('label', 'Authorize Employee'),
            vnode.state.reporters.map((reporter, i) =>
              m('.row.mb-2',
                m('.col-sm-8',
                  m('input.form-control', {
                    type: 'text',
                    placeholder: 'Authorize employee by name or public key...',
                    oninput: m.withAttr('value', (value) => {
                      // clear any previously matched values
                      vnode.state.reporters[i].reporterKey = null
                      const reporter = vnode.state.agents.find(agent => {
                        return agent.name === value || agent.key === value
                      })
                      if (reporter) {
                        vnode.state.reporters[i].reporterKey = reporter.key
                      }
                    }),
                    onblur: () => _updateReporters(vnode, i)
                  })),

                m('.col-sm-4',
                  m(forms.MultiSelect, {
                    label: 'Select Fields',
                    options: authorizableProperties,
                    selected: reporter.properties,
                    onchange: (selection) => {
                      vnode.state.reporters[i].properties = selection
                    }
                  }))))),

          m('.row.justify-content-end.align-items-end',
            m('col-2',
              m('button.btn.btn-primary',
                'Create Record'))))
    ]
  }
}

/**
 * Update the reporter's values after a change occurs in the name of the
 * reporter at the given reporterIndex. If it is empty, and not the only
 * reporter in the list, remove it.  If it is not empty and the last item
 * in the list, add a new, empty reporter to the end of the list.
 */
const _updateReporters = (vnode, reporterIndex) => {
  let reporterInfo = vnode.state.reporters[reporterIndex]
  let lastIdx = vnode.state.reporters.length - 1
  if (!reporterInfo.reporterKey && reporterIndex !== lastIdx) {
    vnode.state.reporters.splice(reporterIndex, 1)
  } else if (reporterInfo.reporterKey && reporterIndex === lastIdx) {
    vnode.state.reporters.push({
      reporterKey: '',
      properties: []
    })
  }
}

/**
 * 
 * concatenation function for itemID
 */
//const nameCreator = () => state.itemName + _.now() + _.random(1, 10000, false);


/**
 * itemID value is concatenation of:
 * * itemName,
 * * unix current time in seconds (lodash _.now),
 * * random number between 1 and 1000 (lodash _.random),
 */
//const setts = forms.stateSetter(vnode.state);
//setts('itemID')(nameCreator);


/**
 * Handle the form submission.
 *
 * Extract the appropriate values to pass to the create record transaction.
 */
const _handleSubmit = (signingKey, state) => {
  const properties = [{
    name: 'itemName',
    stringValue: state.itemName,
    dataType: payloads.createRecord.enum.STRING
  }]
  
  if (state.itemType){
    properties.push({
      name: 'itemType',
      stringValue: state.itemType,
      dataType: payloads.createRecord.enum.STRING
    })
  }

  if (state.quantity) {
    properties.push({
      name: 'quantity',
      numberValue: parsing.toInt(state.quantity),
      dataType: payloads.createRecord.enum.NUMBER
    })
  }
  if (state.unitOfMeasure) {
    properties.push({
      name: 'unitOfMeasure',
      stringValue: state.unitOfMeasure,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.itemCategory) {
    properties.push({
      name: 'itemCategory',
      stringValue: state.itemCategory,
      dataType: payloads.createRecord.enum.STRING
    })
  }

  const recordPayload = payloads.createRecord({
    recordId: state.itemID,
    recordType: 'item',
    properties
  })

  const reporterPayloads = state.reporters
    .filter((reporter) => !!reporter.reporterKey)
    .map((reporter) => payloads.createProposal({
      recordId: state.itemID,
      receivingAgent: reporter.reporterKey,
      role: payloads.createProposal.enum.REPORTER,
      properties: reporter.properties
    }))

  transactions.submit([recordPayload].concat(reporterPayloads), true)
    .then(() => m.route.set(`/items/${state.itemID}`))
}

module.exports = AddItemForm;
