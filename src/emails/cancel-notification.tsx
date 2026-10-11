import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import {
  emailBody,
  emailButtonOutline,
  emailColors,
  emailContainer,
} from "./styles";

export type CancelNotificationEmailProps = {
  requesterName: string;
  taskTitle: string;
  taskUrl: string;
};

export function CancelNotificationEmail({
  requesterName,
  taskTitle,
  taskUrl,
}: CancelNotificationEmailProps) {
  return (
    <Html lang="zh-HK">
      <Head />
      <Preview>志工已取消接單</Preview>
      <Body style={emailBody}>
        <Container style={emailContainer}>
          <Heading
            as="h1"
            style={{ color: emailColors.amber, fontSize: "22px", margin: "0 0 16px" }}
          >
            志工已取消接單
          </Heading>

          <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px" }}>
            親愛的 {requesterName}：
          </Text>
          <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px" }}>
            原定接單的志工已取消接單，您發布的需求已重新放回公開互助池，歡迎其他志工接單。
          </Text>

          <Section
            style={{
              backgroundColor: emailColors.surface,
              borderRadius: "8px",
              padding: "16px",
              margin: "0 0 20px",
            }}
          >
            <Text style={{ fontSize: "14px", margin: "0" }}>需求：{taskTitle}</Text>
          </Section>

          <Button href={taskUrl} style={emailButtonOutline}>
            查看任務詳情
          </Button>

          <Hr style={{ borderColor: emailColors.border, margin: "24px 0 12px" }} />
          <Text style={{ color: emailColors.muted, fontSize: "12px", margin: "0" }}>
            香港社區時間銀行 · 以時間換取關懷
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
