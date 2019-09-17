import { emailService } from "../../services/email/emailService";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";
import { SECRET } from "../../server";

describe("[UNIT] [ACTION]: Send [Service] Email", () => {
  test("creates confirmation link", () => {
    const testOrigin = "http://localhost:4000";
    const testUserId = v4();
    const testToken = jwt.sign({ id: testUserId }, SECRET, { expiresIn: "5m" });
    const testConfirmationLink = `${testOrigin}/confirm/${testToken}`;

    const confirmationLink = emailService.createConfirmationLink(
      testOrigin,
      testToken
    );

    expect(confirmationLink).toBe(testConfirmationLink);
  });

  test("creates reset password link", () => {
    const testOrigin = "http://localhost:4000";
    const testUserId = v4();
    const testToken = jwt.sign({ id: testUserId }, SECRET, { expiresIn: "5m" });
    const testResetPasswordLink = `${testOrigin}/reset-password/${testToken}`;

    const resetLink = emailService.createResetPasswordLink(
      testOrigin,
      testToken
    );

    expect(testResetPasswordLink).toBe(resetLink);
  });

  test("creates confirm email html body", () => {
    const testOrigin = "http://localhost:4000";
    const testUserId = v4();
    const testToken = jwt.sign({ id: testUserId }, SECRET, { expiresIn: "5m" });
    const testConfirmationLink = `${testOrigin}/confirm/${testToken}`;

    const confirmationLink = emailService.createConfirmationLink(
      testOrigin,
      testToken
    );

    expect(confirmationLink).toBe(testConfirmationLink);

    // TODO: create file with confirm email template for better testing
    const testHtmlBody = `Please click <a href="${testConfirmationLink}">here</a> to confirm email.`;

    const htmlBody = emailService.createConfirmEmail(confirmationLink);

    expect(htmlBody).toBe(testHtmlBody);
  });
});
