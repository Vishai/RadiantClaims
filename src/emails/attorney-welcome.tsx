import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface AttorneyWelcomeEmailProps {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  changePasswordUrl: string;
}

export default function AttorneyWelcomeEmail({
  name = "Attorney",
  email = "attorney@example.com",
  temporaryPassword = "TempPassword123!",
  loginUrl = "https://radiantclaims.com/login",
  changePasswordUrl = "https://radiantclaims.com/portal/change-password",
}: AttorneyWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to RadiantClaims - Your Attorney Account is Ready
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to RadiantClaims</Heading>

          <Text style={text}>Hello {name},</Text>

          <Text style={text}>
            Your attorney account has been created on the RadiantClaims
            platform. You now have access to view and manage client claims.
          </Text>

          <Section style={codeBox}>
            <Text style={confirmationCodeText}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={confirmationCodeText}>
              <strong>Temporary Password:</strong> {temporaryPassword}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Log In to Your Account
            </Link>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Important Security Information
          </Heading>

          <Text style={text}>
            <strong>Required:</strong> You must change your password on first
            login for security.
          </Text>

          <Text style={text}>
            After logging in, you'll be prompted to create a new password. Your
            new password must:
          </Text>

          <ul style={list}>
            <li>Be at least 8 characters long</li>
            <li>Contain at least one uppercase letter (A-Z)</li>
            <li>Contain at least one lowercase letter (a-z)</li>
            <li>Contain at least one number (0-9)</li>
          </ul>

          <Text style={text}>
            You can also change your password anytime at:{" "}
            <Link href={changePasswordUrl} style={link}>
              Change Password
            </Link>
          </Text>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            What You Can Do
          </Heading>

          <Text style={text}>
            As an attorney on the RadiantClaims platform, you can:
          </Text>

          <ul style={list}>
            <li>View assigned client claims and their status</li>
            <li>Access client documents and submitted forms</li>
            <li>Monitor claim progress through the DOJ process</li>
            <li>Receive notifications about claim updates</li>
            <li>Manage your client roster</li>
          </ul>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Getting Started
          </Heading>

          <Text style={text}>
            <strong>Step 1:</strong> Log in using the credentials above
          </Text>

          <Text style={text}>
            <strong>Step 2:</strong> Change your temporary password
          </Text>

          <Text style={text}>
            <strong>Step 3:</strong> Explore your attorney dashboard
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions or need assistance, please don't hesitate
            to reach out.
          </Text>

          <Text style={footer}>
            <strong>RadiantClaims Team</strong>
            <br />
            Helping families navigate the RECA claims process
          </Text>

          <Hr style={hr} />

          <Text style={footerSmall}>
            This email was sent to {email} because an attorney account was
            created for you. If you believe this was sent in error, please
            contact us immediately.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1d3f34",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const h2 = {
  color: "#1d3f34",
  fontSize: "24px",
  fontWeight: "600",
  margin: "24px 0 16px",
  padding: "0 40px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 40px",
  margin: "16px 0",
};

const codeBox = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "24px",
  border: "1px solid #e4e4e7",
};

const confirmationCodeText = {
  fontSize: "16px",
  margin: "8px 0",
  color: "#1d3f34",
  fontFamily: "monospace",
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#c56e56",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px",
};

const link = {
  color: "#c56e56",
  textDecoration: "underline",
};

const list = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 40px",
  margin: "8px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 40px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  padding: "0 40px",
  margin: "16px 0",
};

const footerSmall = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
  margin: "8px 0",
};
