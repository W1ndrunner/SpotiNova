import React from "react";
import {
  ChakraProvider,
  Box,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  Link,
  FormControl,
  FormLabel,
  Image,
  extendTheme,
} from "@chakra-ui/react";
const theme = extendTheme({
  colors: {
    brand: {
      text: "#FEFFFE",
    },
    gradients: {
      blackToPurple: "linear(to-br, #000000, #5A007D)",
    },
  },
});
const RegisterPage = () => {
  return (
    <ChakraProvider theme={theme}>
      <Flex
        minHeight="100vh"
        align="center"
        justify="center"
        bgGradient={theme.colors.gradients.blackToPurple}
      >
        <Box position="absolute" top={10} width="full" textAlign="center">
          <Text bgGradient="linear(to-l, #7928CA, #FF0080)" fontSize="6xl" fontWeight="extrabold">
            Spotinova
          </Text>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};
export default RegisterPage;
