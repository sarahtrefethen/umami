import React from 'react';
import classNames from 'classnames';
import styles from './Footer.module.css';
import useLocale from 'hooks/useLocale';
import { rtlLocales } from 'lib/lang';

export default function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="container" dir={rtlLocales.includes(locale) ? 'rtl' : 'ltr'}>
      <div className={classNames(styles.footer, 'row')}></div>
    </footer>
  );
}
