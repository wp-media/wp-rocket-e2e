@cdn @setup 
Feature: CDN banner

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I am on the page '/wp-admin/options-general.php?page=wprocket#page_cdn'

  Scenario: Should validate that CDN purchase banner is displayed
    Given I must see the banner 'High performance Content Delivery Network (CDN) with'
    And I click on '.wpr-rocketcdn-open'
    Then I must see the banner 'Log in to your WP Rocket Account to continue' in iframe '#rocketcdn-iframe'

