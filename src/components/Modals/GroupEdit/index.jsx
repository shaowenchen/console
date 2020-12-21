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
import { observer } from 'mobx-react'
import { toJS } from 'mobx'

import { Modal } from 'components/Base'

import GroupTree from './GroupTree'
import GroupDetail from './GroupDetail'

import styles from './index.scss'

@observer
export default class GroupEdit extends React.Component {
  static propTypes = {
    visible: PropTypes.bool,
    title: PropTypes.string,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
  }

  static defaultProps = {
    visible: false,
  }

  constructor(props) {
    super(props)
    this.store = props.store
    this.state = {
      treeNode: {},
      showForm: true,
      groupId: '',
      groupName: '',
    }
  }

  componentDidMount() {
    const { treeData } = toJS(this.store)
    if (treeData.length > 0) {
      this.setState({
        treeNode: treeData[0],
        showForm: false,
        groupId: treeData[0].group_id,
        groupName: treeData[0].group_name,
      })
    }
  }

  onRef = ref => {
    this.child = ref
  }

  getTreeNodes = () => {
    const treeNode = this.child.tree.getTreeNodes(this.state.groupId).props
    this.setState({ treeNode })
  }

  handleSelect = (key, { selectedNodes }) => {
    this.setState({
      showForm: false,
      treeNode: selectedNodes[0].props,
      groupId: key[0],
      groupName: selectedNodes[0].props.group_name,
    })
  }

  render() {
    const { visible, title, onCancel } = this.props
    const { treeData } = toJS(this.store)
    const { showForm, treeNode, groupId, groupName } = this.state

    return (
      <Modal
        width={1162}
        title={title}
        closable={false}
        cancelText={t('Close')}
        visible={visible}
        onCancel={onCancel}
        bodyClassName={styles.modalBody}
        footerClassName={styles.modalFooter}
      >
        <div className={styles.content}>
          <GroupTree
            onRef={this.onRef}
            treeData={treeData}
            onSelect={this.handleSelect}
          />
          <GroupDetail
            {...this.props}
            getTreeNodes={this.getTreeNodes}
            showForm={showForm}
            treeNode={treeNode}
            groupId={groupId}
            groupName={groupName}
          />
        </div>
      </Modal>
    )
  }
}
