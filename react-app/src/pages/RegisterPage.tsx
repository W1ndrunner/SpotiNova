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
import {FieldValues, SubmitHandler, useForm} from "react-hook-form";
import{ useNavigate } from "react-router-dom";

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
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
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="xl"
          maxWidth="400px"
          width="full"
          >

        </Box>
      </Flex>
    </ChakraProvider>
  );
};
export default RegisterPage;
