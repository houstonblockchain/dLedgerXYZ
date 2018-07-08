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

// UTILITIES IMPORTS
const api = require('../services/api')
const payloads = require('../services/payloads')
const transactions = require('../services/transactions')
const parsing = require('../services/parsing')

//CSS IMPORTS
const forms = require('../components/forms')
const layout = require('../components/layout')

/**
 * Possible selection options
 */
const authorizableProperties = [
  ['testingStatus', 'Testing Stats'],
  ['thcInput', 'THC Input'],
  ['cbdInput', 'CBD Input'],
  ['indicaInput', 'Indica Input'],
  ['sativaInput', 'Sativa Input'],
  ['rodellisInput', 'Rodellis Input'],
]

/**
 * The Form for tracking a new asset.
 */
const AddStrainForm = {
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
    const setter = forms.stateSetter(vnode.state)
    return [
      m('.add_strain_form',
        m('form', {
          onsubmit: (e) => {
            e.preventDefault()
            _handleSubmit(vnode.attrs.signingKey, vnode.state)
          }
        },
          m('legend', 'Add Strain'),
          layout.row(
            [
              forms.textInput(setter('strainName'), 'Strain Name'),
              forms.group('Testing Status', forms.field(setter('testingStatus'), {
                type: 'text',
                required: true
              })),
            ]
          ),
          layout.row(
            [
              forms.group('THC level', forms.field(setter('thcInput'), {
                type: 'number',
                step: 'any',
                required: true,
                placeholder: 'Eg: 0.232'
              })),
              forms.group('CBD level', forms.field(setter('cbdInput'), {
                type: 'number',
                step: 'any',
                required: true,
                placeholder: 'Eg: 0.392'
              }))
            ]
          ),
          layout.row(
            [
              forms.group('Indica Level', forms.field(setter('indicaInput'), {
                type: 'number',
                step: 'any',
                required: true,
                placeholder: '0.152'
              })),
              forms.group('Sativa Level', forms.field(setter('sativaInput'), {
                type: 'number',
                step: 'any',
                required: true,
                placeholder: '0.152'
              })),
              forms.group('Rodellis Level', forms.field(setter('rodellisInput'), {
                type: 'number',
                step: 'any',
                required: true,
                placeholder: '0.152'
              }))
            ]
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
    name: 'testingStatus',
    stringValue: state.testingStatus,
    dataType: payloads.createRecord.enum.STRING
  }]
  
  if (state.thcInput){
    properties.push({
      name: 'thcInput',
      numberValue: parsing.toInt(state.thcInput),
      dataType: payloads.createRecord.enum.NUMBER
    })
  }

  if (state.cbdInput) {
    properties.push({
      name: 'cbdInput',
      numberValue: parsing.toInt(state.cbdInput),
      dataType: payloads.createRecord.enum.NUMBER
    })
  }
  if (state.indicaInput) {
    properties.push({
      name: 'indicaInput',
      numberValue: parsing.toInt(state.indicaInput),
      dataType: payloads.createRecord.enum.NUMBER
    })
  }
  if (state.sativaInput) {
    properties.push({
      name: 'sativaInput',
      numberValue: parsing.toInt(state.sativaInput),
      dataType: payloads.createRecord.enum.NUMBER
    })
  }
  if (state.rodellisInput) {
    properties.push({
      name: 'rodellisInput',
      numberValue: parsing.toInt(state.rodellisInput),
      dataType: payloads.createRecord.enum.NUMBER
    })
  }
  

  const recordPayload = payloads.createRecord({
    recordId: state.strainName,
    recordType: 'strain',
    properties
  })

  const reporterPayloads = state.reporters
    .filter((reporter) => !!reporter.reporterKey)
    .map((reporter) => payloads.createProposal({
      recordId: state.strainName,
      receivingAgent: reporter.reporterKey,
      role: payloads.createProposal.enum.REPORTER,
      properties: reporter.properties
    }))

  transactions.submit([recordPayload].concat(reporterPayloads), true)
    .then(() => m.route.set(`/strains/${state.strainName}`))
}

module.exports = AddStrainForm
