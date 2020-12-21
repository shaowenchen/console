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
import { Button, Icon } from '@kube-design/components'
import { Avatar } from 'components/Base'
import styles from './index.scss'

export default class UserItem extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    selected: PropTypes.bool,
    onSelect: PropTypes.func,
    onDelete: PropTypes.func,
  }

  renderButton() {
    const { selected, onSelect } = this.props
    return selected ? (
      <Button type="flat" icon="check" disabled />
    ) : (
      <Button type="control" icon="add" iconType="light" onClick={onSelect} />
    )
  }

  render() {
    const { user, showDelete, onDelete } = this.props

    return (
      <div className={styles.item} data-user={user.username}>
        <Avatar
          className={styles.avatar}
          avatar={user.avatar_url || '/assets/default-user.svg'}
          iconSize={32}
          title={user.name}
          desc={user.email}
        />
        {!showDelete && this.renderButton()}
        {showDelete && (
          <Button type="flat" onClick={onDelete}>
            <Icon name="trash" size={16} />
          </Button>
        )}
      </div>
    )
  }
}
