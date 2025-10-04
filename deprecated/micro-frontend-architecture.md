# Micro Frontend Architecture

## Summary of "Micro Frontends" by Martin Fowler

The article "Micro Frontends" by Martin Fowler explores the concept of applying microservices principles to frontend development. Instead of building a single, monolithic frontend, the micro frontend approach breaks the user interface into smaller, semi-independent "microapps" that can be developed, tested, and deployed by autonomous teams.

### Key Points:
- **Definition**: Micro frontends are a way to decompose a frontend app into individual, loosely coupled pieces, each owned by different teams.
- **Benefits**:
  - Independent development and deployment cycles for each team.
  - Technology agnosticism: teams can choose their own frameworks and tools.
  - Improved scalability and maintainability.
- **Implementation Patterns**:
  - **Build-time integration**: Micro frontends are combined during the build process. Examples include:
    - Merging multiple React or Angular apps into a single bundle during CI/CD.
    - Using module federation in Webpack to share code at build time.
    - Static site generators that stitch together outputs from different teams.
  - **Run-time integration**: Micro frontends are loaded and composed in the browser at runtime. Examples include:
    - Using iframes to embed separate apps within a shell UI.
    - Loading remote JavaScript bundles dynamically (e.g., Webpack Module Federation at runtime).
    - Web components (custom elements) registered and loaded independently. (See dedicated section below.)
## Run-time integration via Web Components

Web Components provide a powerful way to implement run-time integration for micro frontends. Each team can build and publish a custom element (such as `<user-profile>` or `<budget-widget>`) as a standalone JavaScript bundle. The shell application or host page then loads these bundles dynamically, either via script tags or using import maps.

**Key practices and examples:**
- Each micro frontend exposes its functionality as a custom element, encapsulating its logic and UI.
- The shell app is responsible for loading and placing these elements on the page, orchestrating layout and navigation.
- Communication between web components can be achieved using custom DOM events or by sharing state through a global store (such as Redux or a custom event bus).
- Shadow DOM is used to encapsulate styles, ensuring that CSS from one micro frontend does not leak into others.
- Teams can independently update or deploy their web component, provided the public API (attributes, events) remains stable.

**Example:**
```html
<!-- Shell app HTML -->
<script src="/bundles/user-profile.js"></script>
<script src="/bundles/budget-widget.js"></script>

<user-profile user-id="123"></user-profile>
<budget-widget budget-id="456"></budget-widget>
```

**Example2:**
```html
<html>
  <head>
    <title>Feed me!</title>
  </head>
  <body>
    <h1>Welcome to Feed me!</h1>

    <!-- These scripts don't render anything immediately -->
    <!-- Instead they each define a custom element type -->
    <script src="https://browse.example.com/bundle.js"></script>
    <script src="https://order.example.com/bundle.js"></script>
    <script src="https://profile.example.com/bundle.js"></script>

    <div id="micro-frontend-root"></div>

    <script type="text/javascript">
      // These element types are defined by the above scripts
      const webComponentsByRoute = {
        '/': 'micro-frontend-browse-restaurants',
        '/order-food': 'micro-frontend-order-food',
        '/user-profile': 'micro-frontend-user-profile',
      };
      const webComponentType = webComponentsByRoute[window.location.pathname];

      // Having determined the right web component custom element type,
      // we now create an instance of it and attach it to the document
      const root = document.getElementById('micro-frontend-root');
      const webComponent = document.createElement(webComponentType);
      root.appendChild(webComponent);
    </script>
  </body>
</html>
```

This approach allows for true independence between teams, technology stacks, and release cycles, while maintaining a cohesive user experience through shared contracts and design systems.
    - Edge-side includes (ESI) or server-side includes (SSI) to assemble pages from multiple sources.
- **Challenges**:
  - Consistency in user experience and design.
  - Shared dependencies and versioning.
  - Cross-team communication and coordination.
- **Best Practices**:
  - Define clear ownership boundaries.
  - Use shared design systems and contracts.
  - Automate integration and testing.

### Conclusion
Micro frontends enable large organizations to scale frontend development by empowering teams to work independently, but require careful coordination to ensure a cohesive user experience.

For more details, see the full article: https://martinfowler.com/articles/micro-frontends.html
