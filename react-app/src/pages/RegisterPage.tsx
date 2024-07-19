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
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../stores/useAuthUser";
import { createUser } from "../services/DatabaseAPIClient";

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
const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const passwordValidation = /^(?=.*[A-Z])(?=.*[a-z]).{8,}$/;

  const handleSignIn = (data: { email: string; password: string }) => {
    if (!passwordValidation.test(data.password)) {
      alert(
        "Password must contain at least 8 characters, one uppercase letter and one lowercase letter"
      );
      return;
    }
    handleRegister(data.email, data.password);
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      const response = await createUser({ email, password });
      localStorage.setItem("user", JSON.stringify({ email: email }));
      setUser(email);
      navigate("/home");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex
        minHeight="100vh"
        align="center"
        justify="center"
        bgGradient={theme.colors.gradients.blackToPurple}
      >
        <Box position="absolute" top={0} textAlign="center">
          <Text
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
            fontSize="6xl"
            fontWeight="extrabold"
          >
            SpotiNova
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
          <form
            onSubmit={handleSubmit(handleSignIn as SubmitHandler<FieldValues>)}
          >
            <VStack spacing={6}>
              <FormControl textAlign="left">
                <FormLabel
                  color="brand.text"
                  textAlign="center"
                  fontSize="lg"
                  fontWeight="bold"
                >
                  Register
                </FormLabel>
                <FormLabel color="brand.text" fontSize="sm" mt={4}>
                  E-mail
                </FormLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", { required: true })}
                />
                {errors.email?.type === "required" && (
                  <span>Email is required</span>
                )}
                <FormLabel color="brand.text" fontSize="sm" mt={4}>
                  Password
                </FormLabel>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...register("password", { required: true })}
                />
                {errors.password?.type === "required" && (
                  <span>Password is required</span>
                )}
              </FormControl>
              <Button
                color="white"
                bg="brand.button"
                width="full"
                borderRadius="30px"
                type="submit"
              >
                Sign Up
              </Button>
              <Text color="brand.text" fontSize="sm">
                Already have an account?{" "}
                <Link color="brand.button" fontWeight="semibold" href="/login">
                  Log in
                </Link>
              </Text>
            </VStack>
          </form>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};
export default RegisterPage;
