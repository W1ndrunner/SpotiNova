import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Image,
  Button,
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
  VStack,
} from "@chakra-ui/react";
import NavBar from "../components/NavBar";
import HomeMenu from "../components/Menu";
const theme = extendTheme({
  colors: {
    brand: {
      text: "#000000",
      button: "#5A007D",
    },
    gradients: {
      blackToPurple: "linear(to-br, #000000, #5A007D)",
      salmonToPurple: "linear(to-l, #7928CA, #FF0080)",
    },
  },
});

const RecommendationsPage = () => {
  return (
    <ChakraProvider theme={theme}>
      <Flex
        minHeight="100vh"
        flexDirection="column"
        width="100%"
        bgGradient={theme.colors.gradients.blackToPurple}
      >
        <HStack justifyContent="space-between" width="100%" alignItems="center">
          <Box textAlign="center">
            <Text
              bgGradient="linear(to-l, #7928CA, #FF0080)"
              bgClip="text"
              fontSize="30px"
              fontWeight="extrabold"
            >
              SpotiNova
            </Text>
          </Box>
          <Box justifyContent={"left"}>
            <NavBar />
          </Box>
          <HomeMenu />
        </HStack>
      </Flex>
    </ChakraProvider>
  );
};

export default RecommendationsPage;
