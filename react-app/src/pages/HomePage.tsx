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
import {
  getToken,
  getTopTracks,
  getTopArtists,
} from "../services/SpotifyAPIClient";

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
  class Track {
    name: string;
    artist: string;
    image: string;

    constructor(name: string, artist: string, image: string) {
      this.name = name;
      this.artist = artist;
      this.image = image;
    }
  }
  class Artist {
    name: string;
    image: string;

    constructor(name: string, image: string) {
      this.name = name;
      this.image = image;
    }
  }
  const connect = async () => {
    try {
      window.location.href = "http://localhost:3000/connect";
    } catch (error: any) {
      alert(error.message);
    }
  };
  const generateStats = async () => {
    try {
      const token = await getToken(email);
      const topTracks = await getTopTracks(token.accessToken);
      const topArtists = await getTopArtists(token.accessToken);
      console.log(topTracks.items);
      console.log(topArtists.items);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const generateStatsWithTokens = async (access_token: string) => {
    try {
      const tracksData = await getTopTracks(access_token);
      const artistsData = await getTopArtists(access_token);
      const topArtists: Artist[] = [];
      const topTracks: Track[] = [];

      for (let i = 0; i < tracksData.length; i++) {
        const track = new Track(
          tracksData[i].name,
          tracksData[i].album.artists[0].name,
          tracksData[i].album.images[0].url
        );
        topTracks.push(track);
      }

      for (let i = 0; i < artistsData.length; i++) {
        const artist = new Artist(
          artistsData[i].name,
          artistsData[i].images[0].url
        );
        topArtists.push(artist);
      }
      localStorage.setItem("topTracks", JSON.stringify(topTracks));
      localStorage.setItem("topArtists", JSON.stringify(topArtists));
      localStorage.setItem("statsTime", new Date().getTime().toString());
      window.location.href="/home";
    } catch (error: any) {
      alert(error.message);
    }
  };
  let tokensExist = false;
  let statsExist = false;
  const queryParams = new URLSearchParams(window.location.search);
  const accessToken = queryParams.get("access_token") ?? "";
  const refreshToken = queryParams.get("refresh_token") ?? "";
  if (accessToken != "" && refreshToken != "") {
    tokensExist = true;
  }
  if (localStorage.getItem("topTracks") != null) {
    statsExist = true;
  }
  const renderComponentBasedOnCondition = () => {
    if (tokensExist) {
      const response = addTokens({ email, accessToken, refreshToken });
      return (
        <Button
          colorScheme="purple"
          onClick={() => generateStatsWithTokens(accessToken)}
        >
          Generate Stats
        </Button>
      );
    } else if (statsExist) {
      const topTracksJSON = localStorage.getItem("topTracks");
      const topArtistsJSON = localStorage.getItem("topArtists");
      let topTracks: Track[] = [];
      let topArtists: Artist[] = [];

      if (topTracksJSON != null) {
        topTracks = JSON.parse(topTracksJSON);
      }
      if (topArtistsJSON != null) {
        topArtists = JSON.parse(topArtistsJSON);
      }

      const artistElements = topArtists.map((artist) => (
        <li key={artist.name}>
          <img src={artist.image} alt="Artist" />
          <p>
            <b>{artist.name}</b>
          </p>
        </li>
      ));

      const trackElements = topTracks.map((track) => (
        <li key={track.name}>
          <img src={track.image} alt="Track" />
          <p>
            <b>{track.name}</b>
            {" - " + track.artist}
          </p>
        </li>
      ));

      return (
        <HStack>
          <Box>
            <h2>Top Artists</h2>
            <ul>{artistElements}</ul>
          </Box>
          <Box>
            <h2>Top Tracks</h2>
            <ul>{trackElements}</ul>
          </Box>
        </HStack>
      );
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
