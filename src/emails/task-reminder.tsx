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
  emailButtonOutline,
  emailColors,
  emailContainer,
} from "./styles";

export type TaskReminderEmailProps = {
  recipientName: string;
  otherPartyName: string;
  otherPartyPhone: string;
  taskTitle: string;
  scheduledAt: string;
  hoursBefore: 24 | 2;
  taskUrl: string;
};

export function TaskReminderEmail({
  recipientName,
  otherPartyName,
  otherPartyPhone,
  taskTitle,
  scheduledAt,
  hoursBefore,
  taskUrl,
}: TaskReminderEmailProps) {
  const isImminent = hoursBefore === 2;
  const whatsappUrl = otherPartyPhone
    ? `https://wa.me/852${otherPartyPhone.replace(/^0+/, "")}`
    : null;

  return (
    <Html lang="zh-HK">
      <Head />
      <Preview>
        {isImminent ? "任務將於 2 小時後開始" : "任務將於 24 小時後開始"}
      </Preview>
      <Body style={emailBody}>
        <Container style={emailContainer}>
          <Heading
            as="h1"
            style={{ color: emailColors.brand, fontSize: "22px", margin: "0 0 16px" }}
          >
            {isImminent ? "提提您：任務即將開始" : "提提您：任務明天進行"}
          </Heading>

          <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px" }}>
            親愛的 {recipientName}：
          </Text>
          <Text style={{ fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px" }}>
            {isImminent
              ? "您有任務將於 2 小時後開始，請確認行程安排。"
              : "您有任務將於明天進行，請提前確認行程安排。"}
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
              服務時間：{scheduledAt}
            </Text>
            <Text style={{ fontSize: "14px", margin: "0" }}>
              對方稱呼：{otherPartyName}
            </Text>
          </Section>

          {isImminent && whatsappUrl ? (
            <Section style={{ margin: "0 0 12px" }}>
              <Button href={whatsappUrl} style={emailButton}>
                一鍵 WhatsApp 聯絡
              </Button>
            </Section>
          ) : null}

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
