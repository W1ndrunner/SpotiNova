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
import { connectSpotify, addTokens } from "../services/DatabaseAPIClient";
import useAuthUser from "../stores/useAuthUser";
import {
  getToken,
  getTopTracks,
  getTrackFeatures,
} from "../services/SpotifyAPIClient";
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
  const { authUser, setUser } = useAuthUser();
  const user = JSON.parse(localStorage.getItem("user") ?? "");
  const email = user ? user.email : null;
  class Track {
    name: string;
    id: string;
    artist: string;
    year: number;
    popularity: number;
    danceability: number;
    energy: number;
    key: number;
    loudness: number;
    speechiness: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;

    constructor(
      name: string,
      id: string,
      artist: string,
      year: number,
      popularity: number,
      danceability?: number,
      energy?: number,
      key?: number,
      loudness?: number,
      speechiness?: number,
      acousticness?: number,
      instrumentalness?: number,
      liveness?: number,
      valence?: number,
      tempo?: number
    ) {
      this.name = name;
      this.id = id;
      this.artist = artist;
      this.year = year;
      this.popularity = popularity;
      this.danceability = danceability ?? 0;
      this.energy = energy ?? 0;
      this.key = key ?? 0;
      this.loudness = loudness ?? 0;
      this.speechiness = speechiness ?? 0;
      this.acousticness = acousticness ?? 0;
      this.instrumentalness = instrumentalness ?? 0;
      this.liveness = liveness ?? 0;
      this.valence = valence ?? 0;
      this.tempo = tempo ?? 0;
    }
  }
  const generateRecs = async () => {
    try {
      const topTracks: Track[] = [];
      const token = await getToken(email);
      const tracksData = await getTopTracks(token);
      for (let i = 0; i < tracksData.length; i++) {
        const track = new Track(
          tracksData[i].name,
          tracksData[i].id,
          tracksData[i].album.artists[0].name,
          tracksData[i].album.release_date,
          tracksData[i].popularity
        );
        console.log("Track: " + track);
        topTracks.push(track);
      }
      const trackIds = topTracks.map((track) => track.id);
      const trackFeatures = await getTrackFeatures(token, trackIds);
      for (let i = 0; i < trackFeatures.length; i++) {
        if (trackFeatures[i].id === topTracks[i].id) {
          topTracks[i].danceability = trackFeatures[i].danceability;
          topTracks[i].energy = trackFeatures[i].energy;
          topTracks[i].key = trackFeatures[i].key;
          topTracks[i].loudness = trackFeatures[i].loudness;
          topTracks[i].speechiness = trackFeatures[i].speechiness;
          topTracks[i].acousticness = trackFeatures[i].acousticness;
          topTracks[i].instrumentalness = trackFeatures[i].instrumentalness;
          topTracks[i].liveness = trackFeatures[i].liveness;
          topTracks[i].valence = trackFeatures[i].valence;
          topTracks[i].tempo = trackFeatures[i].tempo;
          console.log("Features added to track: " + (i+1));
        }
      }
      console.log(trackFeatures);
    } catch (error) {
      console.error(error);
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
        <Button colorScheme="purple" onClick={generateRecs}>
          {" "}
          Generate Recommendations
        </Button>
      </Flex>
    </ChakraProvider>
  );
};

export default RecommendationsPage;
