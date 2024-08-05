import React from "react";
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Button,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  extendTheme,
  ChakraProvider,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
const theme = extendTheme({
  colors: {
    brand: {
      text: "#000000",
      button: "#5A007D",
    },
    gradients: {
      blackToPurple: "linear(to-br, #67007A, #430056)",
    },
  },
});

const NavBar = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box
        bgGradient={theme.colors.gradients.blackToPurple}
        borderRadius="40px"
        p={3}
        boxShadow="md"
        maxW="400px"
        width="100%"
      >
        <HStack spacing={4}>
          <Link href="/home">
          <Button colorScheme="brand" variant="solid" borderRadius="md">
            Home
          </Button>
          </Link>
          <Link href="/recommendations">
          <Button colorScheme="brand" variant="solid" borderRadius="md">
            Recommendations
          </Button>
          </Link>
          <Button colorScheme="brand" variant="solid" borderRadius="md">
            Stats
          </Button>
        </HStack>
      </Box>
    </ChakraProvider>
  );
};
export default NavBar;
