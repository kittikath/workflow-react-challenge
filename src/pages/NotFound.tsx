import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Flex, Heading, Text, Link } from '@radix-ui/themes';

/**
 * NotFound - 404 error page
 * Displayed when users attempt to access a non-existent route
 */
export const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <Flex minHeight="100vh" align="center" justify="center" style={{ backgroundColor: '#f8f9fa' }}>
      <Flex direction="column" align="center" gap="4">
        <Heading size="8" weight="bold">
          404
        </Heading>
        <Text size="5" color="gray">
          Oops! Page not found
        </Text>
        <Link href="/" color="blue" style={{ textDecoration: 'underline' }}>
          Return to Home
        </Link>
      </Flex>
    </Flex>
  );
};
