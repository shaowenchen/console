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

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { isEmpty, get } from 'lodash'

import { Notify } from '@kube-design/components'
import DeleteModal from 'components/Modals/Delete'

import GroupForm from './Form'
import GroupCard from './Card'

import styles from './index.scss'

@observer
export default class GroupDetail extends Component {
  static propTypes = {
    treeNode: PropTypes.object,
    showForm: PropTypes.bool,
    groupId: PropTypes.string,
    groupName: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = {
      groupNode: props.treeNode,
      showForm: props.showForm,
      mode: 'create',
      formTemplate: {
        Group: { name: '' },
        WorkspaceRoleBinding: [],
        RoleBinding: [],
      },
      showConfirm: false,
      resource: '',
    }
    this.store = props.store
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.treeNode !== prevState.groupNode) {
      this.setState({ groupNode: this.props.treeNode })
    }
    if (this.props.showForm !== prevState.showForm) {
      this.setState({ showForm: this.props.showForm })
    }
  }

  handleAdd = () => {
    this.setState({
      showForm: true,
      mode: 'create',
      formTemplate: {},
    })
  }

  handleDelete = item => {
    this.setState({
      showConfirm: true,
      resource: item,
    })
  }

  handleConfirm = () => {
    const { workspace } = this.props
    const {
      resource: { group_id },
    } = this.state
    this.store.deleteGroup(group_id, { workspace }).then(() => {
      Notify.success({ content: `${t('Deleted Successfully')}!` })
      this.store.fetchGroup({ workspace })
      this.setState({
        showConfirm: false,
      })
    })
  }

  hideConfirm = () => {
    this.setState({ showConfirm: false })
  }

  handleEdit = async item => {
    const { workspace } = this.props
    const { group } = { group: item.group_name }
    const requests = [
      this.store.getWorksapceRoleBinding({
        group,
        workspace,
      }),
      this.store.getRoleBinding({
        group,
        workspace,
      }),
      this.store.getDevOpsRoleBinding({
        group,
        workspace,
      }),
    ]
    const result = await Promise.all(requests)
    const [WorkspaceRoleBinding, RoleBinding] = result
    this.setState({
      showForm: true,
      mode: 'edit',
      formTemplate: {
        Group: {
          name: item.title,
          annotations: get(item.originData, 'metadata.annotations'),
        },
        WorkspaceRoleBinding: {
          role: WorkspaceRoleBinding.map(role => get(role, 'roleRef.name')),
        },
        projectItems: RoleBinding.map(v => ({
          cluster: get(v, 'metadata.namespace'),
          role: get(v, 'roleRef.name'),
        })),
      },
    })
  }

  handleSave = data => {
    this.props.onOk(data, () => {
      this.props.getTreeNodes(this.state.groupId)
    })
  }

  handleCancel = () => {
    const { groupNode } = this.state
    if (!isEmpty(groupNode)) {
      this.setState({
        showForm: false,
        formTemplate: {},
      })
    } else {
      this.props.onCancel()
    }
  }

  renderBreadcrumbs() {
    const {
      groupNode: { path = [] },
      mode,
      showForm,
    } = this.state
    let breadcrumbs = path
    if (showForm && mode === 'create') {
      breadcrumbs = [...path, t('Add new department')]
    }

    return (
      <ul className={styles.breadcrumbs}>
        {breadcrumbs.map((child, index) => {
          return (
            <li key={`${child}-${index}`}>
              <span>{child}</span>
              {index !== breadcrumbs.length - 1 && (
                <span className={styles.separator}>&gt;</span>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  render() {
    const {
      groupNode,
      showForm,
      formTemplate,
      mode,
      showConfirm,
      resource: { group_name },
    } = this.state
    const { groupId } = this.props

    return (
      <div className={styles.detailWrapper}>
        {this.renderBreadcrumbs()}
        {showForm ? (
          <GroupForm
            {...this.props}
            formTemplate={formTemplate}
            mode={mode}
            groupId={groupId}
            onCancel={this.handleCancel}
            onSave={this.handleSave}
          />
        ) : (
          <GroupCard
            treeNode={groupNode}
            onAdd={this.handleAdd}
            onEdit={this.handleEdit}
            onDelete={this.handleDelete}
          />
        )}
        <DeleteModal
          visible={showConfirm}
          onOk={this.handleConfirm}
          onCancel={this.hideConfirm}
          resource={group_name}
          title={t('Sure to remove')}
          desc={t.html('REMOVE_GROUP_TIP', {
            resource: group_name,
          })}
        />
      </div>
    )
  }
}
