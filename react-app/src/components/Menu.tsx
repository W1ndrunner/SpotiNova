import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Button,
  Menu as ChakraMenu, // Rename the imported component
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  extendTheme,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../stores/useAuthUser";
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
interface Props {
  children: React.ReactNode;
}

const HomeMenu = () => {
  const navigate = useNavigate();
  const { setUser, logoutUser } = useAuthUser();

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      logoutUser();
      navigate("/login");
    } catch (error: any) {
      console.error("Error logging out", error);
    }
  };
  return (
    <Flex alignItems={"center"}>
      <ChakraMenu>
        {" "}
        {/* Use the correct component name */}
        <MenuButton
          as={Button}
          rounded={"full"}
          variant={"link"}
          cursor={"pointer"}
          minW={0}
        >
          <Avatar
            size={"sm"}
            src={
              "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png"
            }
          />
        </MenuButton>
        <MenuList>
          <MenuItem>Account Settings</MenuItem>
          <MenuItem>Link 2</MenuItem>
          <MenuDivider />
          <MenuItem onClick={handleLogout}>Log out</MenuItem>
        </MenuList>
      </ChakraMenu>
    </Flex>
  );
};

export default HomeMenu;
