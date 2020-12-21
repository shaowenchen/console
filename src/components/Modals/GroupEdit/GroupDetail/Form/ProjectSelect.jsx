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
import { computed } from 'mobx'
import { observer } from 'mobx-react'

import { Select, Icon } from '@kube-design/components'
import { ObjectInput } from 'components/Inputs'

import RoleStore from 'stores/role'
import ProjectStore from 'stores/project'

@observer
export default class ProjectSelect extends Component {
  static propTypes = {
    clusters: PropTypes.array,
  }

  constructor(props) {
    super(props)

    this.workspaceStore = props.workspaceStore
    this.projectStore = new ProjectStore()
    this.roleStore = new RoleStore()

    this.state = {
      cluster: '',
      namespace: '',
      role: '',
    }
  }

  @computed
  get projects() {
    return this.projectStore.list.data.map(item => ({
      label: item.name,
      value: item.name,
      item,
    }))
  }

  @computed
  get roles() {
    return this.roleStore.list.data.map(role => ({
      label: role.name,
      value: role.name,
      item: role,
    }))
  }

  fetchProjects() {
    const { cluster } = this.state
    this.projectStore.fetchList({
      workspace: this.props.workspace,
      cluster,
      labelSelector:
        'kubefed.io/managed!=true, kubesphere.io/kubefed-host-namespace!=true',
      limit: -1,
      sortBy: 'createTime',
    })
  }

  fetchRoles() {
    const { cluster, namespace } = this.state
    this.roleStore.fetchList({
      workspace: this.props.workspace,
      cluster,
      namespace,
      limit: -1,
      sortBy: 'createTime',
    })
  }

  handleChange = () => {
    const { cluster, namespace, role } = this.state
    this.props.onChange({ cluster, namespace, role })
  }

  handleClusterChange = cluster => {
    this.setState({ cluster, namespace: '', role: '' }, () => {
      this.handleChange()
      this.fetchProjects()
      this.roleStore.list.update({ data: [] })
    })
  }

  handleProjectsChange = namespace => {
    this.setState({ namespace, role: '' }, () => {
      this.handleChange()
      this.fetchRoles()
    })
  }

  handleRoleChange = role => {
    this.setState({ role }, () => this.handleChange())
  }

  render() {
    const { clusters, value = {} } = this.props

    return (
      <ObjectInput value={value}>
        <Select
          name="cluster"
          options={clusters}
          placeholder={t('Please select a cluster')}
          valueRenderer={option => `${t('Cluster')}: ${option.value}`}
          prefixIcon={<Icon name="cluster" size={16} />}
          onChange={this.handleClusterChange}
        />
        <Select
          name="namespace"
          options={this.projects}
          placeholder={t('Please select a project')}
          valueRenderer={option => `${t('Project')}: ${option.value}`}
          prefixIcon={<Icon name="project" size={16} />}
          onChange={this.handleProjectsChange}
        />
        <Select
          name="role"
          options={this.roles}
          valueRenderer={option => `${t('Project Role')}: ${option.value}`}
          prefixIcon={<Icon name="role" size={16} />}
          placeholder={t('Please select a project role')}
          onChange={this.handleRoleChange}
        />
      </ObjectInput>
    )
  }
}
