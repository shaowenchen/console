/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { computed } from 'mobx'
import { observer } from 'mobx-react'
import { isEmpty, cloneDeep, set, get, concat } from 'lodash'

import { Form, Input, Select, Button } from '@kube-design/components'
import { ArrayInput } from 'components/Inputs'

import { PATTERN_NAME } from 'utils/constants'
import FORM_TEMPLATES from 'utils/form.templates'

import RoleStore from 'stores/role'

import ProjectSelect from './ProjectSelect'
import DevopsSelect from './DevopsSelect'

import styles from './index.scss'

@observer
export default class GroupForm extends React.Component {
  static propTypes = {
    workspace: PropTypes.string,
    groupId: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.formRef = React.createRef()

    this.workspaceStore = props.workspaceStore
    this.workspaceRoleStore = new RoleStore('workspaceroles')

    this.state = {
      formTemplate: cloneDeep(props.formTemplate),
    }
  }

  @computed
  get workspaceRoles() {
    return this.workspaceRoleStore.list.data.map(role => ({
      label: role.name,
      value: role.name,
      item: role,
    }))
  }

  @computed
  get clusters() {
    return this.workspaceStore.clusters.data.map(item => ({
      label: item.name,
      value: item.name,
      disabled: !item.isReady,
      item,
    }))
  }

  componentDidMount() {
    this.fetchWorkspaceRoles()
  }

  fetchWorkspaceRoles() {
    this.workspaceRoleStore.fetchList({
      workspace: this.props.workspace,
      limit: -1,
      sortBy: 'createTime',
    })
  }

  nameValidator = (rule, value, callback) => {
    const { workspace, mode } = this.props
    if (!value || mode === 'edit') {
      return callback()
    }

    this.props.store.checkName({ name: value, workspace }).then(resp => {
      if (resp.exist) {
        return callback({ message: t('Name exists'), field: rule.field })
      }
      callback()
    })
  }

  checkItemValid = value => value.role

  handleSave = () => {
    const { onSave, groupId } = this.props
    const { formTemplate } = this.state
    const form = this.formRef.current
    const {
      Group,
      WorkspaceRoleBinding,
      projectItems,
      devopsItems,
    } = formTemplate
    const data = {}
    const name = get(Group, 'name')
    const RoleBinding = []
    form &&
      form.validate(() => {
        if (groupId) {
          set(Group, 'labels["iam.kubesphere.io/group-parent"]', groupId)
        }
        data.Group = FORM_TEMPLATES['group'](Group)
        if (!isEmpty(WorkspaceRoleBinding)) {
          data.WorkspaceRoleBinding = WorkspaceRoleBinding.role.map(role =>
            FORM_TEMPLATES['workspacerolebinding']({ name, role })
          )
        }

        concat([], projectItems, devopsItems).forEach(item => {
          if (item && item.role) {
            RoleBinding.push(item)
          }
        })

        if (!isEmpty(RoleBinding)) {
          data.RoleBinding = RoleBinding.map(
            ({ cluster, namespace, role }) => ({
              body: [FORM_TEMPLATES['rolebinding']({ name, role })],
              params: { cluster, namespace },
            })
          )
        }
        // console.log(data)
        // return
        onSave(data)
      })
  }

  render() {
    const { onCancel, mode } = this.props
    const { formTemplate } = this.state

    return (
      <div className={styles.formWrapper}>
        <Form data={formTemplate} className={styles.form} ref={this.formRef}>
          <Form.Item
            label={t('Department name')}
            desc={t('NAME_DESC')}
            rules={[
              { required: true, message: t('Please input name') },
              {
                pattern: PATTERN_NAME,
                message: `${t('Invalid name')}, ${t('NAME_DESC')}`,
              },
              { validator: this.nameValidator },
            ]}
          >
            <Input
              name="Group.name"
              autoFocus={true}
              maxLength={63}
              autoComplete="off"
              disabled={mode === 'edit'}
            />
          </Form.Item>
          <Form.Item
            label={t(`${t('Department name')}(${t('Alias')})`)}
            desc={t('ALIAS_DESC')}
          >
            <Input
              name="Group.annotations['kubesphere.io/alias-name']"
              maxLength={63}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            label={t('Workspace role')}
            desc={t('WORKSPACE_ROLE_DESC')}
          >
            <Select
              name="WorkspaceRoleBinding.role"
              options={this.workspaceRoles}
              multi
              closeOnSelect={false}
              onChange={this.handleRolesChange}
            />
          </Form.Item>
          <Form.Group label={t('Binding project role')}>
            <Form.Item>
              <ArrayInput
                name="projectItems"
                itemType="object"
                addText={t('Add project')}
                checkItemValid={this.checkItemValid}
              >
                <ProjectSelect clusters={this.clusters} {...this.props} />
              </ArrayInput>
            </Form.Item>
          </Form.Group>
          <Form.Group label={t('Binding DevOps project role')}>
            <Form.Item>
              <ArrayInput
                name="devopsItems"
                itemType="object"
                addText={t('Add DevOps project')}
                checkItemValid={this.checkItemValid}
              >
                <DevopsSelect clusters={this.clusters} {...this.props} />
              </ArrayInput>
            </Form.Item>
          </Form.Group>
          <div className={styles.footer}>
            <Button onClick={onCancel}>{t('Cancel')}</Button>
            <Button type="primary" onClick={this.handleSave}>
              {t('Save')}
            </Button>
          </div>
        </Form>
      </div>
    )
  }
}
