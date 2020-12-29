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
import { get, set, cloneDeep } from 'lodash'

import { Notify } from '@kube-design/components'
import DeleteModal from 'components/Modals/Delete'

import { safeParseJSON } from 'utils'

import Form from './Form'
import Card from './Card'

import styles from './index.scss'

@observer
export default class Detail extends Component {
  static propTypes = {
    treeNode: PropTypes.object,
    groupId: PropTypes.string,
  }

  constructor(props) {
    super(props)

    this.initialFormTemplate = {
      apiVersion: 'iam.kubesphere.io/v1alpha2',
      kind: 'Group',
      metadata: {
        annotations: {
          'kubesphere.io/workspace-role': `${props.workspace}-regular`,
        },
        labels: {
          'kubesphere.io/workspace': 'wsp1',
        },
      },
    }

    this.state = {
      treeNode: props.treeNode,
      mode: 'create',
      formTemplate: cloneDeep(this.initialFormTemplate),
      showConfirm: false,
      resource: '',
      deleteKeys: [],
    }
    this.store = props.store
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.treeNode !== prevState.treeNode) {
      this.setState({ treeNode: this.props.treeNode })
    }
  }

  isEmptyTreeNode(treeNode) {
    return (
      !treeNode.group_id ||
      (treeNode.group_id === 'root' && !treeNode.children.length)
    )
  }

  getRoleJSON(roles, result) {
    return roles.map(item => {
      const data = result.find(
        v =>
          get(v, 'metadata.namespace') === item.namespace &&
          get(v, 'roleRef.name') === item.role
      )
      return {
        ...item,
        name: get(data, 'metadata.name'),
        disabled: true,
      }
    })
  }

  handleAdd = () => {
    this.setState({
      mode: 'create',
      formTemplate: cloneDeep(this.initialFormTemplate),
    })
    this.props.toggleForm()
  }

  handleDelete = item => {
    this.setState({
      showConfirm: true,
      resource: item,
      deleteKeys: [item.group_id],
    })
  }

  handleConfirm = () => {
    const { workspace } = this.props
    const {
      resource: { group_id },
    } = this.state

    this.store.deleteGroup(group_id, { workspace }).then(() => {
      this.setState({ showConfirm: false, deleteKeys: [group_id] })
      Notify.success({ content: `${t('Deleted Successfully')}!` })
    })
  }

  hideConfirm = () => {
    this.setState({ showConfirm: false })
  }

  handleEdit = async node => {
    const { workspace } = this.props
    const result = await this.store.getRoleBinding(node.group_name, {
      workspace,
    })
    const formData = cloneDeep(node._originData)
    const projectRoles = get(
      formData,
      'metadata.annotations["kubesphere.io/project-roles"]',
      []
    )
    const devopsRoles = get(
      formData,
      'metadata.annotations["kubesphere.io/devops-roles"]',
      []
    )
    set(
      formData,
      'metadata.annotations["kubesphere.io/project-roles"]',
      this.getRoleJSON(safeParseJSON(projectRoles), result)
    )
    set(
      formData,
      'metadata.annotations["kubesphere.io/devops-roles"]',
      this.getRoleJSON(safeParseJSON(devopsRoles), result)
    )
    this.setState({
      mode: 'edit',
      formTemplate: formData,
      treeNode: node,
    })
    this.props.toggleForm()
  }

  handleSave = async (data, detail) => {
    const { workspace } = this.props
    if (detail) {
      await this.store.update(data, detail, { workspace })
      Notify.success({ content: `${t('Updated Successfully')}!` })
    } else {
      await this.store.create(data, { workspace })
      Notify.success({ content: `${t('Added Successfully')}!` })
    }

    this.store.fetchGroup({ workspace })
    this.props.toggleForm()
  }

  handleCancel = () => {
    const { treeNode } = this.props
    if (!this.isEmptyTreeNode(treeNode)) {
      this.setState({
        treeNode,
      })
      this.props.toggleForm()
    } else {
      this.props.onCancel()
    }
  }

  renderBreadcrumbs() {
    const { showForm } = this.props
    const {
      mode,
      treeNode: { path = [] },
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
      formTemplate,
      mode,
      showConfirm,
      resource: { group_name },
      treeNode,
      deleteKeys,
    } = this.state
    const { groupId, showForm } = this.props

    return (
      <div className={styles.detailWrapper}>
        {this.renderBreadcrumbs()}
        {showForm ? (
          <Form
            {...this.props}
            formTemplate={formTemplate}
            mode={mode}
            groupId={groupId}
            onCancel={this.handleCancel}
            onSave={this.handleSave}
          />
        ) : (
          <Card
            treeNode={treeNode}
            deleteKeys={deleteKeys}
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
