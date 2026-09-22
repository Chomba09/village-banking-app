import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Shield, ArrowLeft } from 'lucide-react'

function TermsAndPrivacy() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('terms')

  const SectionHeading = ({ children }) => (
    <h3 style={{
      fontSize: '15px',
      fontWeight: '700',
      color: '#1a0f26',
      marginBottom: '8px',
      marginTop: '24px'
    }}>
      {children}
    </h3>
  )

  const Paragraph = ({ children }) => (
    <p style={{
      fontSize: '14px',
      color: '#3d2456',
      lineHeight: '1.8',
      marginBottom: '12px'
    }}>
      {children}
    </p>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f3f9',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>

      {/* Standalone header */}
      <header style={{
        background: '#2f1b41',
        padding: '0 40px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            background: 'linear-gradient(135deg, #c62c60, #fa8617)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/>
              <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'white',
            letterSpacing: '0.3px'
          }}>
            Village Banking
          </span>
        </div>

        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '7px 14px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <ArrowLeft size={15} />
          Go Back
        </button>
      </header>

      {/* Page content */}
      <div style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a0f26',
          marginBottom: '6px'
        }}>
          Terms & Privacy Policy
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#9a90a8',
          marginBottom: '32px'
        }}>
          Please read these terms and our privacy policy carefully before using the platform.
        </p>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'white',
          border: '1px solid #ddd8e8',
          borderRadius: '6px',
          padding: '4px',
          width: 'fit-content',
          marginBottom: '28px',
          boxShadow: '0 1px 3px rgba(47,27,65,0.08)'
        }}>
          <button
            onClick={() => setActiveTab('terms')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 22px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              background: activeTab === 'terms' ? '#c62c60' : 'transparent',
              color: activeTab === 'terms' ? 'white' : '#3d2456',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={15} />
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 22px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              background: activeTab === 'privacy' ? '#c62c60' : 'transparent',
              color: activeTab === 'privacy' ? 'white' : '#3d2456',
              transition: 'all 0.2s'
            }}
          >
            <Shield size={15} />
            Privacy Policy
          </button>
        </div>

        {/* Content card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '36px',
          boxShadow: '0 1px 4px rgba(47,27,65,0.08)',
          border: '1px solid #ddd8e8'
        }}>
          {activeTab === 'terms' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <FileText size={22} color="#c62c60" />
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a0f26' }}>
                  Terms of Service
                </h2>
              </div>

              <Paragraph>
                Last updated: September 2026. By accessing or using the Village Banking
                platform, you agree to be bound by these Terms of Service. Please read
                them carefully before using the platform.
              </Paragraph>

              <SectionHeading>1. Acceptance of Terms</SectionHeading>
              <Paragraph>
                By registering for and using the Village Banking platform, you confirm
                that you are at least 18 years of age, have read and understood these
                terms, and agree to be legally bound by them. If you do not agree to
                these terms, you may not use the platform.
              </Paragraph>

              <SectionHeading>2. Platform Purpose</SectionHeading>
              <Paragraph>
                Village Banking is a digital platform designed to facilitate the
                management of Village Savings and Loan Associations (VSLAs). It provides
                tools for group treasurers and members to record contributions, manage
                loan applications and repayments, and track financial activity within
                savings groups.
              </Paragraph>

              <SectionHeading>3. User Roles and Responsibilities</SectionHeading>
              <Paragraph>
                Users of the platform operate in one of two roles — Treasurer or Member.
                Treasurers are responsible for the accurate administration of their
                groups, including approving contributions and loans, setting interest
                rates, and communicating with members. Members are responsible for
                ensuring their contributions and loan repayments are made accurately
                and on time.
              </Paragraph>

              <SectionHeading>4. Financial Transactions</SectionHeading>
              <Paragraph>
                The Village Banking platform records and tracks financial activity but
                does not process actual monetary transactions. All real money transfers
                between members and groups occur outside the platform and are the sole
                responsibility of the group members and treasurer. The platform serves
                as a record-keeping and management tool only.
              </Paragraph>

              <SectionHeading>5. Accuracy of Information</SectionHeading>
              <Paragraph>
                You agree to provide accurate, current and complete information when
                registering and using the platform. You are responsible for maintaining
                the accuracy of your profile information, including your contact details.
                Providing false or misleading information may result in suspension of
                your account.
              </Paragraph>

              <SectionHeading>6. Account Security</SectionHeading>
              <Paragraph>
                You are responsible for maintaining the confidentiality of your account
                credentials. You agree to notify the platform administrator immediately
                if you suspect any unauthorised access to your account. The platform
                shall not be liable for any loss resulting from unauthorised use of
                your account.
              </Paragraph>

              <SectionHeading>7. Prohibited Conduct</SectionHeading>
              <Paragraph>
                You agree not to use the platform for any unlawful purpose, to
                misrepresent financial records, to impersonate another user, or to
                interfere with the proper functioning of the platform. Any such conduct
                may result in immediate termination of your account.
              </Paragraph>

              <SectionHeading>8. Termination</SectionHeading>
              <Paragraph>
                The platform administrator reserves the right to suspend or terminate
                any account at any time if these terms are violated. Upon termination,
                your access to the platform will be revoked, though your financial
                records may be retained for audit purposes.
              </Paragraph>

              <SectionHeading>9. Changes to Terms</SectionHeading>
              <Paragraph>
                These terms may be updated from time to time. Continued use of the
                platform after changes are posted constitutes your acceptance of the
                revised terms. Members will be notified of significant changes through
                the platform's notice board.
              </Paragraph>

              <SectionHeading>10. Contact</SectionHeading>
              <Paragraph>
                If you have any questions about these terms, please contact your group
                treasurer or the platform administrator directly.
              </Paragraph>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Shield size={22} color="#c62c60" />
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a0f26' }}>
                  Privacy Policy
                </h2>
              </div>

              <Paragraph>
                Last updated: September 2026. This Privacy Policy describes how the
                Village Banking platform collects, uses and protects your personal
                information. We are committed to ensuring your privacy is protected.
              </Paragraph>

              <SectionHeading>1. Information We Collect</SectionHeading>
              <Paragraph>
                When you register on the platform, we collect your username, email
                address, phone number, and role. During normal use, we also record
                financial activity including contributions made, loan applications,
                loan repayments and account transactions. This information is necessary
                for the platform to function correctly.
              </Paragraph>

              <SectionHeading>2. How We Use Your Information</SectionHeading>
              <Paragraph>
                Your personal information is used solely to operate the Village Banking
                platform — to identify you as a member or treasurer, to record your
                financial activity within your savings group, and to send you
                notifications about group activity that concerns you. We do not use
                your information for marketing purposes.
              </Paragraph>

              <SectionHeading>3. Information Sharing</SectionHeading>
              <Paragraph>
                Your personal details — including your name, email and phone number —
                are visible to the treasurer of any group you belong to, for the
                purpose of group administration and communication. Your financial
                records within a group are visible to your group treasurer. We do not
                share your information with any third parties outside the platform.
              </Paragraph>

              <SectionHeading>4. Data Security</SectionHeading>
              <Paragraph>
                We take reasonable technical measures to protect your personal
                information from unauthorised access, including encrypted authentication
                tokens and secure password storage. However, no system is completely
                secure and we cannot guarantee absolute security of your data.
              </Paragraph>

              <SectionHeading>5. Data Retention</SectionHeading>
              <Paragraph>
                Your personal information and financial records are retained for as
                long as your account is active and for a reasonable period thereafter
                for audit and record-keeping purposes. You may request deletion of
                your personal information by contacting your group treasurer or the
                platform administrator.
              </Paragraph>

              <SectionHeading>6. Your Rights</SectionHeading>
              <Paragraph>
                You have the right to access the personal information we hold about
                you, to request corrections to inaccurate information, and to request
                that your account be deleted. To exercise any of these rights, contact
                your group treasurer or the platform administrator.
              </Paragraph>

              <SectionHeading>7. Cookies</SectionHeading>
              <Paragraph>
                The platform uses browser local storage to maintain your login session
                and remember your preferences such as dark mode. No tracking cookies
                or third-party analytics are used.
              </Paragraph>

              <SectionHeading>8. Changes to This Policy</SectionHeading>
              <Paragraph>
                This privacy policy may be updated from time to time. Any significant
                changes will be communicated to users through the platform's notice
                board. Continued use of the platform after changes are posted
                constitutes acceptance of the revised policy.
              </Paragraph>

              <SectionHeading>9. Contact</SectionHeading>
              <Paragraph>
                If you have any questions or concerns about your privacy or how your
                data is handled, please contact your group treasurer or the platform
                administrator directly.
              </Paragraph>
            </div>
          )}
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '13px',
          color: '#9a90a8'
        }}>
          © 2026 Village Banking. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default TermsAndPrivacy