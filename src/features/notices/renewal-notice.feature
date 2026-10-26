@renewal @setup @notices
Feature: Renewal Notice

  Background:
    Given I am logged in
    And auto renew is disabled

  Scenario Outline: Should display expiring soon renew banner for different license types
    Given "<licenseType>" license is active
    And license is 'expiring_soon'
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then expiring soon banner is displayed
    And renew banner title is "Your license is about to expire!"
    And renew banner message contains "You will soon lose the features that keep your site fast, plus access to updates and support."
    And renew banner message contains "Renew now at"
    And renew banner shows the renewal price
    And renew banner message contains "and keep your site optimized."
    Examples:
      | licenseType |
      | single      |
      | plus        |
      | multi_50    |
      | multi_100   |
      | multi_500   |

  Scenario Outline: Should display expired renew banner for different license types
    Given "<licenseType>" license is active
    And license is 'expired'
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then expired banner is displayed
    And renew banner title is "Your WP Rocket license has expired!"
    And renew banner message contains "Your site has stopped getting faster. You're missing out on the latest speed boosts, new features, and enhancements."
    And renew banner message contains "Renew your license now at"
    And renew banner shows the renewal price
    Examples:
      | licenseType |
      | single      |
      | plus        |
      | multi_50    |
      | multi_100   |
      | multi_500   |

  Scenario Outline: Should display the same renew banner wording for a grandfathered license
    Given "plus" license is active
    And license was created in "2020"
    And license is '<expiration>'
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then renew banner title is "<title>"
    And renew banner message contains "<message>"
    And renew banner message does not contain "discount"
    And renew banner shows the renewal price
    Examples:
      | expiration    | title                               | message                   |
      | expiring_soon | Your license is about to expire!    | Renew now at              |
      | expired       | Your WP Rocket license has expired! | Renew your license now at |

  Scenario: Should display the standard expired banner when expired 2 days ago and OCD is disabled
    Given "single" license is active
    And license is 'just_expired'
    And plugin is installed 'new_release'
    And plugin is activated
    And Optimize CSS Delivery is "disabled"
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then renew banner title is "Your WP Rocket license has expired!"
    And renew banner message contains "Renew your license now at"
    And renew banner shows the renewal price

  Scenario: Should display the OCD expired banner when expired 2 days ago and OCD is enabled
    Given "single" license is active
    And license is 'just_expired'
    And plugin is installed 'new_release'
    And plugin is activated
    And turn on 'RUCSS'
    And Optimize CSS Delivery is "enabled"
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then renew banner title is "Your license has expired. Keep your speed gains!"
    And renew banner message contains "Your CSS optimization will stop working on"
    And renew banner shows a date 12 to 14 days from today
    And renew banner message contains "and your pages will slow down, affecting your traffic and conversions. You'll also lose access to plugin updates and support."
