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
import { toJS } from 'mobx'
import classnames from 'classnames'
import { get, throttle } from 'lodash'

import {
  Icon,
  Button,
  Level,
  LevelLeft,
  LevelRight,
  Notify,
} from '@kube-design/components'
import Banner from 'components/Cards/Banner'
import withList, { ListPage } from 'components/HOCs/withList'

import UserStore from 'stores/user'
import GroupStore from 'stores/group'

import EditGroupModal from 'workspaces/components/Modals/EditGroup'
import GroupTree from './GroupTree'
import GroupUser from './GroupUser'

import styles from './index.scss'

@withList({
  store: new GroupStore(),
  module: 'groups',
  injectStores: ['rootStore', 'workspaceStore'],
})
export default class Groups extends React.Component {
  constructor(props) {
    super(props)
    this.store = props.store
    this.userStore = new UserStore()

    this.state = {
      group: '',
      groupTitle: '',
      selectUserKeys: [],
      refreshFlag: false,
      showModal: false,
    }
  }

  componentWillUnmount() {
    this.unmount = true
  }

  fetchGroup = ({ refresh }) => {
    const { workspace } = this.props.match.params
    this.store.fetchGroup({ workspace }).then(() => {
      if (!this.unmount) {
        if (refresh) {
          this.setState(prev => ({
            refreshFlag: !prev.refreshFlag,
          }))
        } else {
          const { treeData } = this.store
          this.setState({
            group: get(treeData[0], 'children[0].key'),
            groupTitle: get(treeData[0], 'children[0].title'),
          })
        }
      }
    })
  }

  handleRefresh = throttle(() => {
    this.fetchGroup({ refresh: true })
  }, 1000)

  handleSelectTree = (key, { selectedNodes }) => {
    this.setState({
      group: key[0],
      groupTitle: selectedNodes[0].props.title,
      selectUserKeys: [],
    })
  }

  handleSelectUser = user => {
    this.setState(prevState => ({
      selectUserKeys: [...prevState.selectUserKeys, user.name],
    }))
  }

  handleCancelSelect = () => {
    this.setState({ selectUserKeys: [] })
  }

  handleAddGroup = () => {
    const { workspace } = this.props.match.params
    const { selectUserKeys, group } = this.state
    const data = selectUserKeys.map(user => ({
      userName: user,
      groupName: group,
    }))

    this.store
      .addGroupBinding(data, {
        workspace,
      })
      .then(() => {
        Notify.success({ content: `${t('Added Successfully')}!` })
        this.setState(prev => ({
          refreshFlag: !prev.refreshFlag,
          selectUserKeys: [],
        }))
      })
  }

  showEditModal = () => {
    this.setState({ showModal: true })
  }

  hideModal = () => {
    this.setState({ showModal: false })
  }

  renderBanner() {
    return (
      <Banner
        icon="group"
        title={t('Workspace Groups')}
        description={t('WORKSPACE_GROUP_DESC')}
      />
    )
  }

  renderTitle() {
    const { selectUserKeys } = this.state
    const showSelect = selectUserKeys.length > 0

    return (
      <div
        className={classnames(
          styles.contentHeader,
          showSelect && styles.hasSelected
        )}
      >
        {showSelect ? this.renderSelectedTitle() : this.renderToolBar()}
      </div>
    )
  }

  renderToolBar() {
    return (
      <Level>
        <LevelLeft></LevelLeft>
        <LevelRight>
          <Button type="flat" onClick={this.handleRefresh}>
            <Icon name="refresh" />
          </Button>
          <Button type="control" onClick={this.showEditModal}>
            {t('Maintenance organization')}
          </Button>
        </LevelRight>
      </Level>
    )
  }

  renderSelectedTitle() {
    return (
      <Level>
        <LevelLeft>
          {t.html('Add members to', { group: this.state.groupTitle })}
        </LevelLeft>
        <LevelRight>
          <Button type="primary" onClick={this.handleAddGroup}>
            {t('OK')}
          </Button>
          <Button onClick={this.handleCancelSelect}>{t('Deselect')}</Button>
        </LevelRight>
      </Level>
    )
  }

  render() {
    const { treeData, total, isLoading } = toJS(this.store)
    const { group, selectUserKeys, refreshFlag, showModal } = this.state

    return (
      <ListPage {...this.props} getData={this.fetchGroup}>
        {this.renderBanner()}
        <div className={styles.wrapper}>
          {this.renderTitle()}
          <div className={styles.content}>
            <div className={styles.container}>
              <GroupTree
                treeData={treeData}
                total={total}
                isLoading={isLoading}
                onSelect={this.handleSelectTree}
              />
              <GroupUser
                groupStore={this.store}
                userStore={this.userStore}
                group={group}
                refreshFlag={refreshFlag}
                selectedKeys={selectUserKeys}
                onSelect={this.handleSelectUser}
                {...this.props}
              />
            </div>
          </div>
        </div>
        {showModal && (
          <EditGroupModal
            visible={showModal}
            title={t('Maintenance organization')}
            treeData={treeData}
            store={this.store}
            workspaceStore={this.props.workspaceStore}
            onCancel={this.hideModal}
            {...this.props.match.params}
          />
        )}
      </ListPage>
    )
  }
}
