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

const m = require('mithril')

const api = require('../services/api')
const payloads = require('../services/payloads')
const transactions = require('../services/transactions')
const parsing = require('../services/parsing')
const forms = require('../components/forms')
const layout = require('../components/layout')

/**
 * Possible selection options
 */
const authorizableProperties = [
  ['legalName', 'Business name'],
  ['dba', 'DBA'],
  ['licenseStatus', 'Status'],
  ['licensCategory', 'License Category'],
  ['licenseImage', 'Image'],
  ['licenseEmail', 'Email'],
  ['licensePhoneNumber', 'Phonenumber'],
  ['licenseAddress', 'Address'],
  ['uids', 'UIDs'],
  ['titles', 'Titles'],
  ['strains', 'Strains'],
  ['items', 'Items'],
  ['rooms', 'Rooms'],
  ['patients', 'Patients']
]

/**
 * The Form for tracking a new asset.
 */
const AddFacilityForm = {
  oninit (vnode) {
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

  view (vnode) {
    const setter = forms.stateSetter(vnode.state)
    return [
      m('.add_titles_form',
        m('form', {
          onsubmit: (e) => {
            e.preventDefault()
            _handleSubmit(vnode.attrs.signingKey, vnode.state)
          }
        },
        m('legend', 'Add title'),
        
        forms.group('Job Title', forms.field(setter('jobTitle'), {
          type: 'text',
          required: true
        })),
        forms.group('Rooms', forms.field(setter('rooms'), {
          type: 'text',
          required: true
        })),
        forms.group('Patients', forms.field(setter('patients'), {
          type: 'text',
          required: true
        })),
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
              'Create Record')))))
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
 * Handle the form submission.
 *
 * Extract the appropriate values to pass to the create record transaction.
 */
const _handleSubmit = (signingKey, state) => {
  const properties = [{
    name: 'legalName',
    stringValue: state.legalName,
    dataType: payloads.createRecord.enum.STRING
  }]

  if (state.dba) {
    properties.push({
      name: 'dba',
      stringValue: state.dba,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.licenseType) {
    properties.push({
      name: 'licenseType',
      stringValue: state.licenseType,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.licenseStatus) {
    properties.push({
      name: 'licenseStatus',
      stringValue: state.licenseStatus,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.licenseExpiration) {
    properties.push({
      name: 'licenseExpiration',
      stringValue: state.licenseExpiration,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.licenseCategory) {
    properties.push({
      name: 'licenseCategory',
      stringValue: state.licenseCategory,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  
  if (state.licenseImage) {
    properties.push({
      name: 'licenseImage',
      stringValue: state.licenseImage,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.licenseEmail) {
    properties.push({
      name: 'licenseEmail',
      stringValue: state.licenseEmail,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.licensePhoneNumber) {
    properties.push({
      name: 'licensePhoneNumber',
      stringValue: state.licensePhoneNumber,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.owner) {
    properties.push({
      name: 'owner',
      stringValue: state.owner,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.admin) {
    properties.push({
      name: 'admin',
      stringValue: state.admin,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.uids) {
    properties.push({
      name: 'uids',
      stringValue: state.uids,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.titles) {
    properties.push({
      name: 'titles',
      stringValue: state.titles,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.strains) {
    properties.push({
      name: 'strains',
      stringValue: state.strains,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.items) {
    properties.push({
      name: 'items',
      stringValue: state.items,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.rooms) {
    properties.push({
      name: 'rooms',
      stringValue: state.rooms,
      dataType: payloads.createRecord.enum.STRING
    })
  }
  if (state.patients) {
    properties.push({
      name: 'patients',
      stringValue: state.patients,
      dataType: payloads.createRecord.enum.STRING
    })
  }

  const recordPayload = payloads.createRecord({
    recordId: state.licenseNumber,
    recordType: 'facility',
    properties
  })

  const reporterPayloads = state.reporters
    .filter((reporter) => !!reporter.reporterKey)
    .map((reporter) => payloads.createProposal({
      recordId: state.licenseNumber,
      receivingAgent: reporter.reporterKey,
      role: payloads.createProposal.enum.REPORTER,
      properties: reporter.properties
    }))

  transactions.submit([recordPayload].concat(reporterPayloads), true)
    .then(() => m.route.set(`/assets/${state.licenseNumber}`))
}

module.exports = AddFacilityForm
