import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
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
} from "@chakra-ui/react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { connectSpotify, addTokens } from "../services/DatabaseAPIClient";
import useAuthUser from "../stores/useAuthUser";
import  getToken, getTopTracks, getTopArtists from "../services/SpotifyAPIClient";
const theme = extendTheme({
  colors: {
    brand: {
      text: "#000000",
      button: "#5A007D",
    },
    gradients: {
      blackToPurple: "linear(to-br, #000000, #5A007D)",
    },
  },
});

const HomePage = () => {
  const { authUser, setUser } = useAuthUser();
  const user = JSON.parse(localStorage.getItem("user") ?? "");
  const email = user ? user.email : null;
  const connect = async () => {
    try {
      window.location.href = "http://localhost:3000/connect";
    } catch (error: any) {
      alert(error.message);
    }
  };
  const generateStats = async () => {};
  let tokensExist = false;
  const statsExist = false;
  const queryParams = new URLSearchParams(window.location.search);
  const accessToken = queryParams.get("access_token") ?? "";
  const refreshToken = queryParams.get("refresh_token") ?? "";
  if (accessToken != ""  && refreshToken != "") {
    tokensExist = true;
  }
  const renderComponentBasedOnCondition = () => {
    if (tokensExist) {
      const response = addTokens({ email, accessToken, refreshToken });
      return (
        <Button colorScheme="purple" onClick={generateStats}>
          Generate Stats
        </Button>
      );
    } else if (statsExist) {
      // TODO Render stats
      return <Text>Stats exist</Text>;
    } else {
      return (
        <Button colorScheme="purple" onClick={connect}>
          Connect to Spotify
        </Button>
      );
    }
  };
  return (
    <ChakraProvider theme={theme}>
      <Flex
        minHeight="100vh"
        flexDirection="column"
        width="100%"
        bgGradient={theme.colors.gradients.blackToPurple}
      >
        <NavBar />
        {renderComponentBasedOnCondition()}
      </Flex>
    </ChakraProvider>
  );
};

export default HomePage;
