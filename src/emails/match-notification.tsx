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
  emailButton,
  emailColors,
  emailContainer,
} from "./styles";

export type MatchNotificationEmailProps = {
  requesterName: string;
  volunteerName: string;
  taskTitle: string;
  scheduledAt: string;
  taskUrl: string;
};

export function MatchNotificationEmail({
  requesterName,
  volunteerName,
  taskTitle,
  scheduledAt,
  taskUrl,
}: MatchNotificationEmailProps) {
  return (
    <Html lang="zh-HK">
      <Head />
      <Preview>有志工接取了您的需求</Preview>
      <Body style={emailBody}>
        <Container style={emailContainer}>
          <Heading
            as="h1"
            style={{ color: emailColors.brand, fontSize: "22px", margin: "0 0 16px" }}
          >
            有志工接單啦！
          </Heading>

          <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px" }}>
            親愛的 {requesterName}：
          </Text>
          <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px" }}>
            好消息！您發布的需求已有志工接單，即將為您提供協助。
          </Text>

          <Section
            style={{
              backgroundColor: emailColors.surface,
              borderRadius: "8px",
              padding: "16px",
              margin: "0 0 20px",
            }}
          >
            <Text style={{ fontSize: "14px", margin: "0 0 8px" }}>
              需求：{taskTitle}
            </Text>
            <Text style={{ fontSize: "14px", margin: "0 0 8px" }}>
              志工稱呼：{volunteerName}
            </Text>
            <Text style={{ fontSize: "14px", margin: "0" }}>
              預計服務時間：{scheduledAt}
            </Text>
          </Section>

          <Button href={taskUrl} style={emailButton}>
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
