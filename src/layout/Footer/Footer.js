import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaCreativeCommons, FaGithub } from "react-icons/fa";
import "./Footer.scss";

export default function Footer() {
  return (
    <Navbar className="Footer" bg="light" expand="lg">
      <Container>
        <Nav className="mr-auto">
          <Navbar.Brand
            id="wikidata-logo"
            target="_blank"
            href="https://www.wikidata.org"
          >
            <img
              height="30"
              src={"/powered-by-wikidata-light.png"}
              alt="Powered By Wikidata"
            />
          </Navbar.Brand>
          <Nav.Link
            target="_blank"
            href="https://creativecommons.org/licenses/by-sa/4.0/deed.en"
          >
            <FaCreativeCommons />
          </Nav.Link>
          <Nav.Link target="_blank" href="https://github.com/ogroppo/entitree">
            <FaGithub />
          </Nav.Link>
          <Nav.Item id="twitterFollowButton">
            <a
              href={`https://twitter.com/EntitreeApp?ref_src=twsrc%5Etfw`}
              className="twitter-follow-button"
              // data-size="large"
              // data-show-screen-name=""
              // data-show-count=""
            >
              Follow EntiTree
            </a>
          </Nav.Item>
        </Nav>
        <Nav className="ml-auto rightLinks">
          <Nav.Link href="/about">About</Nav.Link>
          <Nav.Link href="/privacy">Privacy</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
