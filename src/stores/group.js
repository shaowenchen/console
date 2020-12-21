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

import { observable, action } from 'mobx'
import { get } from 'lodash'
import { formatTreeData } from 'utils/group'
import Base from './base'

export default class GroupStore extends Base {
  module = 'groups'

  @observable
  treeData = []

  get apiVersion() {
    return 'kapis/iam.kubesphere.io/v1alpha2'
  }

  getPath({ cluster, workspace, namespace, devops }) {
    let path = ''

    if (cluster) {
      path += `/klusters/${cluster}`
    }

    if (namespace) {
      return `${path}/namespaces/${namespace}`
    }

    if (devops) {
      return `${path}/devops/${devops}`
    }

    if (workspace) {
      return `/workspaces/${workspace}`
    }

    return path
  }

  getResourceUrl = (params = {}) =>
    `kapis/iam.kubesphere.io/v1alpha2${this.getPath(params)}/groups`

  @action
  async fetchGroup({ workspace, ...params } = {}) {
    this.isLoading = true

    params.sortBy = 'createTime'
    params.limit = -1

    const result = await request.get(
      this.getResourceUrl({ workspace, ...params })
    )
    const data = get(result, 'items', []).map(item => ({
      key: get(item, 'metadata.name'),
      title: get(item, 'metadata.generateName'),
      group_id: get(item, 'metadata.name'),
      group_name: get(item, 'metadata.generateName'),
      alias_name: get(item, 'metadata.annotations["kubesphere.io/alias-name"]'),
      parent_id: get(item, 'metadata.labels["iam.kubesphere.io/group-parent"]'),
      originData: item,
    }))
    this.total = get(result, 'totalItems')
    if (this.total > 0) {
      this.treeData = [
        {
          key: 'root',
          title: workspace,
          group_id: 'root',
          group_name: workspace,
          path: [workspace],
          children: formatTreeData(data, workspace),
        },
      ]
    }
    this.isLoading = false
  }

  @action
  create(data, params) {
    const requests = []
    if (data.Group) {
      requests.push(request.post(this.getResourceUrl(params), data.Group))
    }
    if (data.WorkspaceRoleBinding) {
      requests.push(
        this.addWorksapceRoleBinding(data.WorkspaceRoleBinding, params)
      )
    }
    if (data.RoleBinding) {
      data.RoleBinding.map(rolebinding =>
        requests.push(
          this.addRolebindings(rolebinding.body, rolebinding.params)
        )
      )
    }

    return this.submitting(Promise.all(requests))
  }

  @action
  checkName({ name, ...params }) {
    return request.get(
      `${this.getResourceUrl(params)}`,
      {
        name,
      },
      {
        headers: { 'x-check-exist': true },
      }
    )
  }

  @action
  addGroupBinding(data, params = {}) {
    return request.post(
      `${this.apiVersion}${this.getPath(params)}/groupbindings`,
      data
    )
  }

  @action
  addWorksapceRoleBinding(data, params = {}) {
    return request.post(
      `${this.apiVersion}${this.getPath(params)}/workspacerolebindings`,
      data
    )
  }

  @action
  addRolebindings(data, params = {}) {
    return request.post(
      `${this.apiVersion}${this.getPath(params)}/rolebindings`,
      data
    )
  }

  @action getGroupBinding({ group, workspace }) {
    return request.get(
      `${this.apiVersion}${this.getPath({
        workspace,
      })}/groups/${group}/groupbindings`
    )
  }

  @action
  async getWorksapceRoleBinding({ group, workspace }) {
    return await request.get(
      `${this.apiVersion}${this.getPath({
        workspace,
      })}/groups/${group}/workspacerolebindings`
    )
  }

  @action
  async getRoleBinding({ group, workspace }) {
    return await request.get(
      `${this.apiVersion}${this.getPath({
        workspace,
      })}/groups/${group}/rolebindings`
    )
  }

  @action
  async getDevOpsRoleBinding({ group, workspace }) {
    return await request.get(
      `${this.apiVersion}${this.getPath({
        workspace,
      })}/groups/${group}/devopsrolebindings`
    )
  }

  @action
  deleteGroup(name, params = {}) {
    return request.delete(
      `${this.apiVersion}${this.getPath(params)}/groups/${name}`
    )
  }

  @action
  deleteGroupBinding(name, params = {}) {
    return request.delete(
      `${this.apiVersion}${this.getPath(params)}/groupbindings/${name}`
    )
  }
}
