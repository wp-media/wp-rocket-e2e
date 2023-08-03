Feature: CPCSS Notice

  Background:
    Given plugin wp-rocket is activated
    And I am on the page '/wp-admin/options-general.php?page=wprocket#file_optimization'

  Scenario: Unexpired account with CPCSS and click RUCSS
    Given I have an unexpired account
    And I have CPCSS turned on
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When click on 'Turn on Remove Unused CSS'
    Then I must not see the banner 'Critical CSS generation is currently running'
    Then I must see the banner 'The Remove Unused CSS service is processing your pages'

  Scenario: Unexpired account with CPCSS and click Dismiss
    When I have an unexpired account
    And I have CPCSS turned on
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When click on 'Stay with the old option'
    And refresh the page
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When turn on RUCSS
    And save the option
    And turn on CPCSS
    And save the option
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'

  Scenario: Unexpired account with CPCSS and go admin homepage
    When I have an unexpired account
    And I have CPCSS turned on
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When I go '/wp-admin'
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'

  Scenario: Expired account with CPCSS
    Given I have CPCSS turned on
    And I have an expired accountF
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'

  Scenario: Unexpired account with CPCSS and other user
    Given I have an unexpired account
    And plugin wp-rocket is activated
    And I have CPCSS turned on
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When click on 'Turn on Remove Unused CSS'
    Then I must see the banner 'The Remove Unused CSS service is processing your pages'
    When I connect as 'admin2'
    And I go '/wp-admin/options-general.php?page=wprocket#file_optimization'
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
