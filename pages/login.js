import React from 'react';
import Layout from 'components/layout/Layout';
import Loading from '../components/common/Loading';

export default function LoginPage() {
  return (
    <Layout title="login" header={false} footer={false} center>
      <Loading />
    </Layout>
  );
}
