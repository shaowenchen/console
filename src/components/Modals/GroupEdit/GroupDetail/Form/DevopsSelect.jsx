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
import { computed, toJS } from 'mobx'
import { observer } from 'mobx-react'

import { Select, Icon } from '@kube-design/components'
import { ObjectInput } from 'components/Inputs'

import RoleStore from 'stores/role'
import DevOpsStore from 'stores/devops'

@observer
export default class DevopsSelect extends Component {
  static propTypes = {
    clusters: PropTypes.array,
  }

  constructor(props) {
    super(props)

    this.devopsStore = new DevOpsStore()
    this.devopsRoleStore = new RoleStore()

    this.state = {
      cluster: '',
      devops: '',
      role: '',
    }
  }

  @computed
  get devops() {
    const { data } = toJS(this.devopsStore.list)
    return data.map(item => ({
      label: item.name,
      value: item.devops,
      item,
    }))
  }

  @computed
  get roles() {
    return this.devopsRoleStore.list.data.map(item => ({
      label: item.name,
      value: item.name,
      item,
    }))
  }

  fetchDevops() {
    const { cluster } = this.state
    this.devopsStore.fetchList({
      workspace: this.props.workspace,
      cluster,
      limit: -1,
      sortBy: 'createTime',
    })
  }

  fetchDevopsRoles() {
    const { cluster, devops } = this.state
    this.devopsRoleStore.fetchList({
      devops,
      cluster,
      limit: -1,
      sortBy: 'createTime',
    })
  }

  handleChange = () => {
    const { cluster, devops, role } = this.state
    this.props.onChange({ cluster, devops, role })
  }

  handleClusterChange = cluster => {
    this.setState({ cluster, devops: '', role: '' }, () => {
      this.handleChange()
      this.fetchDevops()
      this.devopsRoleStore.list.update({ data: [] })
    })
  }

  handleDevopsChange = devops => {
    this.setState({ devops, role: '' }, () => {
      this.handleChange()
      this.fetchDevopsRoles()
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
          name="devops"
          options={this.devops}
          placeholder={t('Please select a DevOps project')}
          valueRenderer={option => `${t('DevOps')}: ${option.value}`}
          prefixIcon={<Icon name="strategy-group" size={16} />}
          onChange={this.handleDevopsChange}
        />
        <Select
          name="role"
          options={this.role}
          valueRenderer={option =>
            `${t('DEVOPS_PROJECT_ROLES')}: ${option.value}`
          }
          prefixIcon={<Icon name="role" size={16} />}
          placeholder={t('Please select a project role')}
          onChange={this.handleRoleChange}
        />
      </ObjectInput>
    )
  }
}
