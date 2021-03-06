import "./Header.scss";

import {
  Button,
  Container,
  Dropdown,
  DropdownButton,
  Nav,
  Navbar,
} from "react-bootstrap";
import React, { useState } from "react";

import { EXAMPLES } from "../../constants/examples";
import { FiSliders } from "react-icons/fi";
import Logo from "../../components/Logo/Logo";
import ReactGA from "react-ga";
import { SITE_NAME } from "../../constants/meta";
import SettingsModal from "../../modals/SettingsModal/SettingsModal";
import styled from "styled-components";

export default function Header({ simple }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const openSettingsModal = () => {
    ReactGA.modalview("settings");
    setShowSettingsModal(true);
  };

  const openExampleLink = (e) => {
    ReactGA.event({
      category: "Examples",
      action: "Clicked on example",
      label: e.target.href,
    });
  };

  return (
    <ThemedHeader className="Header" bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">
          <Logo /> {SITE_NAME}
        </Navbar.Brand>
        {!simple && (
          <DropdownButton
            title="Examples"
            variant="info"
            size="sm"
            id="mainExamplesButtom"
            className="examplesButton"
          >
            {EXAMPLES.map(({ name, href }) => (
              <Dropdown.Item key={name} href={href} onClick={openExampleLink}>
                {name}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        )}
        {!simple && (
          <Nav className="ml-auto">
            <Button
              className="settingsButton"
              variant="none"
              onClick={openSettingsModal}
            >
              settings
              <FiSliders className="ml-2" />
            </Button>
            <SettingsModal
              show={showSettingsModal}
              hideModal={() => setShowSettingsModal(false)}
            />
          </Nav>
        )}
      </Container>
    </ThemedHeader>
  );
}

const ThemedHeader = styled(Navbar)`
  flex: 0 0 ${({ theme }) => theme.headerHeight}px;
`;
