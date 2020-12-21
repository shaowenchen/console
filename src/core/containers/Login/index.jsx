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
import { inject, observer } from 'mobx-react'
import {
  Alert,
  Button,
  Form,
  Input,
  InputPassword,
} from '@kube-design/components'

import { get, set } from 'lodash'

import Captcha from './Captcha'

import styles from './index.scss'

function encrypt(salt, str) {
  return mix(salt, window.btoa(str))
}

function mix(salt, str) {
  if (str.length > salt.length) {
    salt += str.slice(0, str.length - salt.length)
  }

  const ret = []
  const prefix = []
  for (let i = 0, len = salt.length; i < len; i++) {
    const tomix = str.length > i ? str.charCodeAt(i) : 64
    const sum = salt.charCodeAt(i) + tomix
    prefix.push(sum % 2 === 0 ? '0' : '1')
    ret.push(String.fromCharCode(Math.floor(sum / 2)))
  }

  return `${window.btoa(prefix.join(''))}@${ret.join('')}`
}

@inject('rootStore')
@observer
export default class Login extends Component {
  state = {
    formData: {},
    isSubmmiting: false,
    errorCount: get(globals, 'errorCount', 0),
    captchaId: Date.now(),
  }

  handleOAuthLogin = e => {
    window.location.href = e.currentTarget.dataset.url
  }

  handleSubmit = data => {
    const { username, password, ...rest } = data
    this.setState({ isSubmmiting: true })
    this.props.rootStore
      .login({
        username,
        encrypt: encrypt('kubesphere', password),
        ...rest,
      })
      .then(resp => {
        this.setState({ isSubmmiting: false })
        if (resp.status !== 200) {
          set(this.state.formData, 'captcha', '')
          this.setState({
            errorMessage: resp.message,
            errorCount: resp.errorCount,
            captchaId: Date.now(),
          })
        }
      })
  }

  handleReloadCaptha = () => {
    this.setState({ captchaId: Date.now() })
  }

  render() {
    const {
      formData,
      isSubmmiting,
      errorMessage,
      errorCount,
      captchaId,
    } = this.state
    return (
      <div>
        <a href="/" className={styles.logo}>
          <img src="/assets/logo.svg" alt="" />
        </a>
        <div className={styles.login}>
          <div className={styles.header}>{t('Please Log In')}</div>
          <div className={styles.divider}></div>
          {get(globals, 'oauthServers', []).map(server => (
            <div
              key={server.url}
              className={styles.oauth}
              data-url={server.url}
              onClick={this.handleOAuthLogin}
            >
              <span>{t('Log In with {title}', { title: server.title })}</span>
            </div>
          ))}
          {errorMessage && (
            <Alert
              className="margin-t12 margin-b12"
              type="error"
              message={t(errorMessage)}
            />
          )}
          <Form data={formData} onSubmit={this.handleSubmit}>
            <Form.Item
              label={t('Username or Email')}
              rules={[
                {
                  required: true,
                  message: t('Please input username or email'),
                },
              ]}
            >
              <Input name="username" placeholder="User@example.com" />
            </Form.Item>
            <Form.Item
              label={t('Password')}
              rules={[{ required: true, message: t('Please input password') }]}
            >
              <InputPassword name="password" placeholder="Password" />
            </Form.Item>
            {errorCount > 2 && (
              <Form.Item
                label={t('Captcha')}
                rules={[{ required: true, message: t('Please input captch') }]}
              >
                <Captcha
                  name="captcha"
                  captchaId={captchaId}
                  onReloadCaptcha={this.handleReloadCaptha}
                />
              </Form.Item>
            )}
            <div className={styles.footer}>
              <Button type="control" htmlType="submit" loading={isSubmmiting}>
                {t('Log In')}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    )
  }
}
