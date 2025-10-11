
import { Redirect } from 'expo-router';
import React from 'react';

const AuthIndex = () => {
    return <Redirect href="/(auth)/login" />;
};

export default AuthIndex;
