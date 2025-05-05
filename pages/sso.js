import React, { useEffect, useState } from 'react';
import Layout from 'components/layout/Layout';
import Loading from 'components/common/Loading';
import usePost from 'hooks/usePost';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { useKeycloak } from '@react-keycloak/ssr';

export default function SSOPage() {
  const post = usePost();
  const router = useRouter();
  const [message, setMessage] = useState();
  const { keycloak, initialized } = useKeycloak();

  const handleSSO = async keycloak_token => {
    const { ok, status, data } = await post('/api/auth/sso', {
      keycloak_token: keycloak_token,
    });

    if (ok) {
      return router.push('/');
    } else {
      setMessage(
        status === 401 ? (
          <FormattedMessage id="message.failed-sso" defaultMessage="Sign On Failed." />
        ) : (
          data
        ),
      );
    }
  };

  useEffect(() => {
    if (initialized && keycloak?.token) {
      handleSSO(keycloak.token);
    }
  }, [keycloak, initialized]);

  return (
    <Layout title="sso" header={false} footer={false} center>
      <Loading />
      {message && <span>{message}</span>}
    </Layout>
  );
}
