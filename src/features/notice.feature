@cpcss @setup 
Feature: CPCSS Notice

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I am on the page '/wp-admin/options-general.php?page=wprocket#file_optimization'

  Scenario: Should enable RUCSS and hide notice when clicking turn on RUCSS
    Given I have an unexpired account
    And turn on 'CPCSS'
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When click on 'Turn on Remove Unused CSS'
    Then I must not see the banner 'Critical CSS generation is currently running'
    Then I must see the banner 'The Remove Unused CSS service is processing your pages'

  Scenario: Should keep the current settings and hide notice when clicking stay with old option 
    When I have an unexpired account
    And turn on 'CPCSS'
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When click on 'Stay with the old option'
    And refresh the page
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When turn on 'RUCSS'
    And save the option
    And turn on 'CPCSS'
    And save the option
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'

  Scenario: Should display the CPCSS banner only at WPR settings
    When I have an unexpired account
    And turn on 'CPCSS'
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When I go '/wp-admin'
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'


  Scenario: Shouldnot display the CPCSS banner for expired user
    Given turn on 'CPCSS'
    And I have an expired account
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'


  Scenario: Shouldnot display the CPCSS banner to admin 2 if it was dismissed by admin 1
    Given I have an unexpired account
    And turn on 'CPCSS'
    Then I must see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
    When click on 'Turn on Remove Unused CSS'
    Then I must see the banner 'The Remove Unused CSS service is processing your pages'
    When I connect as 'admin2'
    And I go '/wp-admin/options-general.php?page=wprocket#file_optimization'
    Then I must not see the banner 'We highly recommend the updated Remove Unused CSS for a better CSS optimization. Load CSS Asynchronously is always available as a back-up.'
